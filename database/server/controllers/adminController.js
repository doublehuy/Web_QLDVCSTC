const pool = require('../config/database');

// Lấy danh sách tất cả lịch hẹn (admin)
const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', date_from = '', date_to = '', customer_id = '' } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT a.*, p.name as pet_name, p.species, u.full_name as customer_name, u.phone as customer_phone,
             s.name as service_name, s.price, s.duration_minutes
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    if (date_from) {
      paramCount++;
      query += ` AND a.appointment_date >= $${paramCount}`;
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      query += ` AND a.appointment_date <= $${paramCount}`;
      params.push(date_to);
    }

    if (customer_id) {
      paramCount++;
      query += ` AND a.customer_id = $${paramCount}`;
      params.push(customer_id);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Đếm tổng số lịch hẹn
    let countQuery = 'SELECT COUNT(*) FROM appointments WHERE 1=1';
    let countParams = [];

    if (status) {
      countQuery += ' AND status = $1';
      countParams.push(status);
    }

    if (date_from) {
      countParams.push(date_from);
      countQuery += countParams.length === 1 ? ' AND appointment_date >= $2' : ' AND appointment_date >= $3';
    }

    if (date_to) {
      countParams.push(date_to);
      countQuery += countParams.length === 1 ? ' AND appointment_date <= $2' : ' AND appointment_date <= $4';
    }

    if (customer_id) {
      countParams.push(customer_id);
      countQuery += countParams.length === 1 ? ' AND customer_id = $2' : ' AND customer_id = $5';
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalAppointments = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        appointments: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalAppointments,
          total_pages: Math.ceil(totalAppointments / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách lịch hẹn (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn'
    });
  }
};

// Xóa (vô hiệu hóa) khách hàng (admin)
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra khách hàng tồn tại và là role customer
    const existing = await pool.query(
      `SELECT id, full_name, role, is_active FROM users WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    const user = existing.rows[0];

    if (user.role !== 'customer') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa tài khoản khách hàng'
      });
    }

    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Khách hàng đã bị vô hiệu hóa trước đó'
      });
    }

    await pool.query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Đã vô hiệu hóa khách hàng thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa khách hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa khách hàng'
    });
  }
};

// Cập nhật trạng thái lịch hẹn (admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const result = await pool.query(
      `UPDATE appointments 
       SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Nếu lịch hẹn hoàn thành, tạo hóa đơn
    if (status === 'completed') {
      const appointment = result.rows[0];
      
      // Kiểm tra hóa đơn đã tồn tại chưa
      const existingInvoice = await pool.query(
        'SELECT id FROM invoices WHERE appointment_id = $1',
        [id]
      );

      if (existingInvoice.rows.length === 0) {
        // Tạo hóa đơn mới
        const invoiceNumber = `INV-${Date.now()}`;
        const taxRate = 0.1; // 10% VAT
        const subtotal = appointment.total_price;
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;

        await pool.query(
          `INSERT INTO invoices (appointment_id, customer_id, invoice_number, subtotal, tax_amount, total_amount, payment_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [id, appointment.customer_id, invoiceNumber, subtotal, taxAmount, totalAmount]
        );

        // Thêm chi tiết hóa đơn
        await pool.query(
          `INSERT INTO invoice_items (invoice_id, service_id, service_name, quantity, unit_price, total_price)
           SELECT $1, s.id, s.name, 1, s.price, s.price
           FROM services s
           WHERE s.id = $2`,
          [invoiceNumber, appointment.service_id]
        );

        // Thêm vào lịch sử dịch vụ
        await pool.query(
          `INSERT INTO service_history (appointment_id, pet_id, service_id, service_date, veterinarian)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, appointment.pet_id, appointment.service_id, appointment.appointment_date, 'Dr. Admin']
        );
      }
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái lịch hẹn thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái lịch hẹn'
    });
  }
};

// Lấy danh sách khách hàng (admin)
const getAllCustomers = async (req, res) => {
  console.log('🔍 Bắt đầu xử lý yêu cầu lấy danh sách khách hàng');
  console.log('📋 Query params:', req.query);
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        u.*, 
        COUNT(DISTINCT p.id) AS pet_count, 
        COUNT(DISTINCT a.id) AS appointment_count
      FROM users u
      LEFT JOIN pets p ON u.id = p.owner_id AND p.is_active = true
      LEFT JOIN appointments a ON u.id = a.customer_id
      WHERE u.role = 'customer'
    `;
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY u.id, u.full_name, u.email, u.phone, u.address, u.role, u.is_active, u.created_at, u.updated_at 
               ORDER BY u.created_at DESC 
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Đếm tổng số khách hàng
    let countQuery = "SELECT COUNT(*) FROM users WHERE role = 'customer'";
    let countParams = [];

    if (search) {
      countQuery += ' AND (full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)';
      countParams.push(`%${search}%`);
    }

    console.log('🔢 Đếm tổng số khách hàng với query:', countQuery);
    const countResult = await pool.query(countQuery, countParams);
    const totalCustomers = parseInt(countResult.rows[0].count);
    console.log('📊 Tổng số khách hàng:', totalCustomers);

    res.json({
      success: true,
      data: {
        customers: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalCustomers,
          total_pages: Math.ceil(totalCustomers / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khách hàng'
    });
  }
};

// Lấy danh sách hóa đơn (admin)
const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, payment_status = '', date_from = '', date_to = '' } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT i.*, u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone,
             a.appointment_date, a.appointment_time, p.name as pet_name, s.name as service_name
      FROM invoices i
      LEFT JOIN users u ON i.customer_id = u.id
      LEFT JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (payment_status) {
      paramCount++;
      query += ` AND i.payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    if (date_from) {
      paramCount++;
      query += ` AND i.created_at >= $${paramCount}`;
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      query += ` AND i.created_at <= $${paramCount}`;
      params.push(date_to);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Đếm tổng số hóa đơn
    let countQuery = 'SELECT COUNT(*) FROM invoices WHERE 1=1';
    let countParams = [];

    if (payment_status) {
      countQuery += ' AND payment_status = $1';
      countParams.push(payment_status);
    }

    if (date_from) {
      countParams.push(date_from);
      countQuery += countParams.length === 1 ? ' AND created_at >= $2' : ' AND created_at >= $3';
    }

    if (date_to) {
      countParams.push(date_to);
      countQuery += countParams.length === 1 ? ' AND created_at <= $2' : ' AND created_at <= $4';
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalInvoices = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        invoices: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalInvoices,
          total_pages: Math.ceil(totalInvoices / limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách hóa đơn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hóa đơn'
    });
  }
};

// Cập nhật trạng thái thanh toán hóa đơn (admin)
const updateInvoicePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_method } = req.body;

    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ'
      });
    }

    const result = await pool.query(
      `UPDATE invoices 
       SET payment_status = $1, payment_method = $2, payment_date = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [payment_status, payment_method, payment_status === 'paid' ? new Date() : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái thanh toán'
    });
  }
};

// Thống kê tổng quan (admin)
const getDashboardStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // Số ngày gần đây
    const periodDays = parseInt(period) || 30;

    // Thống kê tổng quan
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'customer' AND is_active = true) as total_customers,
        (SELECT COUNT(*) FROM pets WHERE is_active = true) as total_pets,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed' AND appointment_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')) as completed_appointments,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')) as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE payment_status = 'pending' AND created_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')) as pending_revenue
    `, [periodDays]);

    // Thống kê theo ngày (7 ngày gần nhất)
    const dailyStats = await pool.query(`
      SELECT
        DATE(appointment_date) as date,
        COUNT(*) as appointments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(appointment_date)
      ORDER BY date DESC
    `);

    // Thống kê dịch vụ phổ biến
    const popularServices = await pool.query(`
      SELECT
        s.name,
        s.category,
        COUNT(a.id) as appointment_count,
        COALESCE(SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id
        AND a.appointment_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.category
      ORDER BY appointment_count DESC
      LIMIT 5
    `, [periodDays]);

    res.json({
      success: true,
      data: {
        period: periodDays,
        overview: stats.rows[0],
        daily_stats: dailyStats.rows,
        popular_services: popularServices.rows
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê dashboard'
    });
  }
};

// Lấy danh sách yêu cầu dịch vụ đặc thù (admin)
const getCustomServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT csr.*, u.full_name as customer_name, u.phone as customer_phone,
             u.email as customer_email
      FROM custom_service_requests csr
      LEFT JOIN users u ON csr.user_id = u.id
      WHERE 1=1
    `;
    
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND csr.status = $${paramCount}`;
      params.push(status);
    }

    // Đếm tổng số bản ghi
    const countQuery = `SELECT COUNT(*) FROM (${query}) as total`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Thêm phân trang
    query += ` ORDER BY csr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: {
        requests: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting custom service requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu dịch vụ đặc thù',
      error: error.message
    });
  }
};

// Cập nhật trạng thái yêu cầu dịch vụ đặc thù (admin)
const updateCustomServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['pending', 'in_progress', 'completed', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const result = await pool.query(
      `UPDATE custom_service_requests 
       SET status = $1, 
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, admin_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu dịch vụ đặc thù'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating custom service request status:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái yêu cầu',
      error: error.message
    });
  }
};

module.exports = {
  getAllAppointments,
  updateAppointmentStatus,
  getAllCustomers,
  getAllInvoices,
  updateInvoicePaymentStatus,
  getDashboardStats,
  getCustomServiceRequests,
  updateCustomServiceRequestStatus,
  deleteCustomer
};
