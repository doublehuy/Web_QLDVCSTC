const pool = require('../config/database');

// Lấy danh sách dịch vụ
const getServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, category = '', search = '' } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT * FROM services WHERE is_active = true
    `;
    let params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY category, name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Đếm tổng số dịch vụ
    let countQuery = 'SELECT COUNT(*) FROM services WHERE is_active = true';
    let countParams = [];

    if (category) {
      countQuery += ' AND category = $1';
      countParams.push(category);
    }

    if (search) {
      countParams.push(`%${search}%`);
      countQuery += countParams.length === 1 ? ' AND (name ILIKE $2 OR description ILIKE $2)' : ' AND (name ILIKE $3 OR description ILIKE $3)';
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalServices = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        services: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalServices,
          total_pages: Math.ceil(totalServices / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách dịch vụ'
    });
  }
};

// Lấy thông tin chi tiết dịch vụ
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin dịch vụ'
    });
  }
};

// Tạo dịch vụ mới (chỉ admin)
const createService = async (req, res) => {
  try {
    const { name, description, price, duration_minutes, category } = req.body;

    const result = await pool.query(
      `INSERT INTO services (name, description, price, duration_minutes, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, duration_minutes, category]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi tạo dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo dịch vụ'
    });
  }
};

// Cập nhật dịch vụ (chỉ admin)
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration_minutes, category, is_active } = req.body;

    const result = await pool.query(
      `UPDATE services 
       SET name = $1, description = $2, price = $3, duration_minutes = $4, 
           category = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, description, price, duration_minutes, category, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật dịch vụ thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi cập nhật dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật dịch vụ'
    });
  }
};

// Xóa dịch vụ (soft delete - chỉ admin)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra dịch vụ có đang được sử dụng trong lịch hẹn không
    const appointmentCheck = await pool.query(
      'SELECT id FROM appointments WHERE service_id = $1 AND status IN ($2, $3)',
      [id, 'pending', 'confirmed']
    );

    if (appointmentCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa dịch vụ vì còn lịch hẹn đang sử dụng'
      });
    }

    await pool.query(
      'UPDATE services SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Xóa dịch vụ thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa dịch vụ'
    });
  }
};

// Lấy danh sách danh mục dịch vụ
const getServiceCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM services WHERE is_active = true ORDER BY category'
    );

    res.json({
      success: true,
      data: result.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('Lỗi lấy danh mục dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh mục dịch vụ'
    });
  }
};

// Thống kê dịch vụ theo mức độ sử dụng (chỉ admin)
const getServiceStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // Số ngày gần đây

    const result = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.category,
        s.price,
        COUNT(a.id) as total_appointments,
        SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as total_revenue
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id 
        AND a.appointment_date >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.category, s.price
      ORDER BY total_appointments DESC, total_revenue DESC`
    );

    res.json({
      success: true,
      data: {
        period: parseInt(period),
        services: result.rows
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê dịch vụ'
    });
  }
};

// Lấy thông tin chi tiết dịch vụ công khai (không cần đăng nhập)
const getServiceByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin dịch vụ'
    });
  }
};

// Lấy danh sách dịch vụ công khai (không cần đăng nhập)
const getPublicServices = async (req, res) => {
  try {
    const { category = '', search = '' } = req.query;

    let query = `
      SELECT id, name, description, price, duration_minutes as duration,
             category, is_active, created_at,
             CASE WHEN category = 'medical' THEN 'Khám chữa bệnh'
                  WHEN category = 'spa' THEN 'Spa & Làm đẹp'
                  WHEN category = 'boarding' THEN 'Gửi thú cưng'
                  WHEN category = 'training' THEN 'Huấn luyện'
                  ELSE 'Chăm sóc đặc biệt' END as category_name
      FROM services WHERE is_active = true
    `;
    let params = [];
    let paramCount = 0;

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY category, name`;

    const result = await pool.query(query, params);

    // Thêm thông tin bổ sung cho từng dịch vụ
    const services = result.rows.map(service => ({
      ...service,
      features: [], // Có thể thêm features nếu có bảng riêng
      rating: 4.5 + Math.random() * 0.5, // Rating mẫu
      reviews: Math.floor(Math.random() * 100) + 10, // Reviews mẫu
      popular: Math.random() > 0.7 // 30% dịch vụ là phổ biến
    }));

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách dịch vụ công khai:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách dịch vụ'
    });
  }
};

// Lấy danh mục dịch vụ công khai
const getPublicServiceCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'medical', name: 'Khám chữa bệnh', icon: 'stethoscope' },
      { id: 'spa', name: 'Spa & Làm đẹp', icon: 'scissors' },
      { id: 'boarding', name: 'Gửi thú cưng', icon: 'home' },
      { id: 'training', name: 'Huấn luyện', icon: 'zap' },
      { id: 'care', name: 'Chăm sóc đặc biệt', icon: 'heart' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh mục dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh mục dịch vụ'
    });
  }
};

module.exports = {
  getServices,
  getServiceById,
  getServiceByIdPublic,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
  getServiceStatistics,
  getPublicServices,
  getPublicServiceCategories
};
