const pool = require('../config/database');

// Lấy danh sách nhân viên theo chuyên môn
const getEmployeesBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.query;

    let query = `
      SELECT employee_id, full_name, phone, email, address, specialization, status, created_at, updated_at
      FROM employees
      WHERE status = 'đang làm'
    `;
    let params = [];

    if (specialization) {
      query += ` AND specialization = $1`;
      params.push(specialization);
    }

    query += ` ORDER BY full_name`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nhân viên'
    });
  }
};

// Lấy tất cả nhân viên
const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT employee_id, full_name, phone, email, address, specialization, status, created_at, updated_at
      FROM employees
      ORDER BY full_name
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tất cả nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nhân viên'
    });
  }
};

// Lấy thông tin nhân viên theo ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT employee_id, full_name, phone, email, address, specialization, status, created_at, updated_at
      FROM employees
      WHERE employee_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin nhân viên'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin nhân viên'
    });
  }
};

// Tạo nhân viên mới
const createEmployee = async (req, res) => {
  const client = await pool.connect();
  try {
    const { full_name, phone, email, specialization, status, address } = req.body;
    
    console.log('Dữ liệu nhận được từ client:', { full_name, phone, email, specialization, status, address });

    // Kiểm tra dữ liệu bắt buộc
    if (!full_name || !specialization || !email) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên, email và chuyên môn là bắt buộc'
      });
    }

    await client.query('BEGIN');

    // 1. Kiểm tra email đã tồn tại trong bảng users chưa
    const userCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại trong hệ thống'
      });
    }

    // 2. Tạo tài khoản người dùng mới
    const password = phone || '123456'; // Mật khẩu mặc định là số điện thoại hoặc 123456
    const passwordHash = require('bcrypt').hashSync(password, 10);
    
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, full_name, phone, address, role)
      VALUES ($1, $2, $3, $4, $5, 'staff')
      RETURNING id
    `, [email, passwordHash, full_name, phone || null, address || null]);

    const userId = userResult.rows[0].id;
    console.log('Đã tạo user mới với ID:', userId);

    // 3. Tạo nhân viên mới
    const employeeResult = await client.query(`
      INSERT INTO employees (full_name, phone, email, address, specialization, status, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING employee_id, full_name, phone, email, address, specialization, status, created_at, updated_at
    `, [full_name, phone || null, email, address || null, specialization, status || 'đang làm', userId]);
    
    console.log('Đã tạo nhân viên mới với ID:', employeeResult.rows[0].employee_id);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Tạo nhân viên thành công',
      data: employeeResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi tạo nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo nhân viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Cập nhật thông tin nhân viên
const updateEmployee = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { full_name, phone, email, address, specialization, status } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!full_name || !specialization || !email) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên, email và chuyên môn là bắt buộc'
      });
    }

    await client.query('BEGIN');

    // 1. Lấy thông tin nhân viên hiện tại để lấy user_id
    const currentEmployee = await client.query(
      'SELECT user_id, email as current_email FROM employees WHERE employee_id = $1',
      [id]
    );

    if (currentEmployee.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên để cập nhật'
      });
    }

    const userId = currentEmployee.rows[0].user_id;
    const currentEmail = currentEmployee.rows[0].current_email;

    // 2. Kiểm tra email mới đã tồn tại chưa (nếu email thay đổi)
    if (email && email !== currentEmail) {
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Email đã tồn tại trong hệ thống'
        });
      }
    }

    // 3. Cập nhật thông tin người dùng
    await client.query(`
      UPDATE users
      SET 
        email = $1,
        full_name = $2,
        phone = $3,
        address = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [email, full_name, phone || null, address || null, userId]);

    // 4. Cập nhật thông tin nhân viên
    const result = await client.query(`
      UPDATE employees
      SET 
        full_name = $1, 
        phone = $2, 
        email = $3, 
        address = $4,
        specialization = $5, 
        status = $6, 
        updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $7
      RETURNING employee_id, full_name, phone, email, address, specialization, status, created_at, updated_at
    `, [full_name, phone || null, email, address || null, specialization, status, id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Cập nhật thông tin nhân viên thành công',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi cập nhật nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật nhân viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Xóa nhân viên
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra nhân viên có đang được sử dụng trong lịch hẹn không
    const appointmentCheck = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE employee_id = $1',
      [id]
    );

    if (appointmentCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa nhân viên đang có lịch hẹn'
      });
    }

    const result = await pool.query(
      'DELETE FROM employees WHERE employee_id = $1 RETURNING employee_id, full_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên để xóa'
      });
    }

    res.json({
      success: true,
      message: 'Xóa nhân viên thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi xóa nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa nhân viên'
    });
  }
};

// Lấy danh sách lịch hẹn của nhân viên
const getEmployeeAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status } = req.query;

    let query = `
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.status, a.notes,
        s.name as service_name, s.duration_minutes,
        p.name as pet_name, p.species as pet_species,
        u.full_name as customer_name, u.phone as customer_phone
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN pets p ON a.pet_id = p.id
      JOIN users u ON a.customer_id = u.id
      WHERE a.employee_id = $1
    `;
    
    const params = [id];
    let paramIndex = 2;

    // Lọc theo khoảng thời gian
    if (startDate) {
      query += ` AND a.appointment_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND a.appointment_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Lọc theo trạng thái
    if (status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ' ORDER BY a.appointment_date, a.appointment_time';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn nhân viên'
    });
  }
};

// Kiểm tra xem nhân viên có bận trong khung giờ không
const checkEmployeeAvailability = async (employeeId, date, time, duration, excludeAppointmentId = null) => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.employee_id = $1 
        AND a.appointment_date = $2
        AND a.status IN ('pending', 'confirmed', 'in_progress')
        AND (
          (a.appointment_time, a.appointment_time + (s.duration_minutes * interval '1 minute')) 
          OVERLAPS 
          ($3::time, $3::time + ($4 * interval '1 minute'))
        )
        AND ($5 IS NULL OR a.id != $5)
    `;

    const result = await pool.query(query, [
      employeeId, 
      date, 
      time, 
      duration,
      excludeAppointmentId
    ]);

    return result.rows[0].count === 0;
  } catch (error) {
    console.error('Lỗi khi kiểm tra lịch làm việc của nhân viên:', error);
    throw error;
  }
};

module.exports = {
  getEmployeesBySpecialization,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAppointments,
  checkEmployeeAvailability
};
