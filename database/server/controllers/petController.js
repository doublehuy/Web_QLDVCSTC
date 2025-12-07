const pool = require('../config/database');

// Lấy danh sách thú cưng của user
const getPets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search = '' } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, u.full_name as owner_name
      FROM pets p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = $1 AND p.is_active = true
    `;
    let params = [userId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.species ILIKE $${paramCount} OR p.breed ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Đếm tổng số thú cưng
    let countQuery = 'SELECT COUNT(*) FROM pets WHERE owner_id = $1 AND is_active = true';
    let countParams = [userId];

    if (search) {
      countQuery += ' AND (name ILIKE $2 OR species ILIKE $2 OR breed ILIKE $2)';
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalPets = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        pets: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalPets,
          total_pages: Math.ceil(totalPets / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách thú cưng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thú cưng'
    });
  }
};

// Lấy thông tin chi tiết thú cưng
const getPetById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT p.*, u.full_name as owner_name
       FROM pets p
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1 AND p.owner_id = $2 AND p.is_active = true`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thú cưng'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin thú cưng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin thú cưng'
    });
  }
};

// Tạo thú cưng mới
const createPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, species, breed, age, gender, weight, color, medical_notes, image_url } = req.body;

    const result = await pool.query(
      `INSERT INTO pets (owner_id, name, species, breed, age, gender, weight, color, medical_notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, name, species, breed, age, gender, weight, color, medical_notes, image_url || null]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm thú cưng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi tạo thú cưng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thú cưng'
    });
  }
};

// Cập nhật thông tin thú cưng
const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, species, breed, age, gender, weight, color, medical_notes } = req.body;

    // Kiểm tra thú cưng có thuộc về user không
    const checkResult = await pool.query(
      'SELECT id FROM pets WHERE id = $1 AND owner_id = $2 AND is_active = true',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thú cưng hoặc bạn không có quyền chỉnh sửa'
      });
    }

    const result = await pool.query(
      `UPDATE pets 
       SET name = $1, species = $2, breed = $3, age = $4, gender = $5, 
           weight = $6, color = $7, medical_notes = $8, image_url = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND owner_id = $11
       RETURNING *`,
      [name, species, breed, age, gender, weight, color, medical_notes, image_url || null, id, userId]
    );

    res.json({
      success: true,
      message: 'Cập nhật thông tin thú cưng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi cập nhật thú cưng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thú cưng'
    });
  }
};

// Xóa thú cưng (soft delete)
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Kiểm tra thú cưng có thuộc về user không
    const checkResult = await pool.query(
      'SELECT id FROM pets WHERE id = $1 AND owner_id = $2 AND is_active = true',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thú cưng hoặc bạn không có quyền xóa'
      });
    }

    // Kiểm tra thú cưng có lịch hẹn đang chờ không
    const appointmentCheck = await pool.query(
      'SELECT id FROM appointments WHERE pet_id = $1 AND status IN ($2, $3)',
      [id, 'pending', 'confirmed']
    );

    if (appointmentCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa thú cưng vì còn lịch hẹn đang chờ xử lý'
      });
    }

    await pool.query(
      'UPDATE pets SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Xóa thú cưng thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa thú cưng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thú cưng'
    });
  }
};

// Lấy lịch sử dịch vụ của thú cưng
const getPetServiceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Kiểm tra thú cưng có thuộc về user không
    const petCheck = await pool.query(
      'SELECT id FROM pets WHERE id = $1 AND owner_id = $2 AND is_active = true',
      [id, userId]
    );

    if (petCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thú cưng'
      });
    }

    const result = await pool.query(
      `SELECT sh.*, s.name as service_name, s.category, a.appointment_date, a.appointment_time
       FROM service_history sh
       LEFT JOIN services s ON sh.service_id = s.id
       LEFT JOIN appointments a ON sh.appointment_id = a.id
       WHERE sh.pet_id = $1
       ORDER BY sh.service_date DESC, a.appointment_time DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử dịch vụ:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử dịch vụ'
    });
  }
};

module.exports = {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  getPetServiceHistory
};
