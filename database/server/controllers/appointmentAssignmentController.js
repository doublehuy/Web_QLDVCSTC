const pool = require('../config/database');
const { checkEmployeeAvailability } = require('./employeesController');
const notificationController = require('./notificationController');

// Phân công nhân viên cho lịch hẹn
const assignEmployee = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { employee_id } = req.body;

    // 1. Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản trị viên mới có quyền phân công nhân viên'
      });
    }

    // 2. Kiểm tra nhân viên có tồn tại và đang làm việc không
    const employeeCheck = await client.query(
      'SELECT employee_id, full_name, specialization, status FROM employees WHERE employee_id = $1 AND status = $2',
      [employee_id, 'đang làm']
    );

    if (employeeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Nhân viên không tồn tại hoặc không đang làm việc'
      });
    }

    const employee = employeeCheck.rows[0];

    // 3. Lấy thông tin lịch hẹn và dịch vụ
    const appointmentResult = await client.query(
      `SELECT a.*, s.category, s.duration_minutes, s.name as service_name,
              p.name as pet_name, u.full_name as customer_name, u.phone as customer_phone
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN pets p ON a.pet_id = p.id
       JOIN users u ON a.customer_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointmentResult.rows[0];

    // 4. Kiểm tra trạng thái lịch hẹn
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể phân công cho lịch hẹn đang chờ xử lý hoặc đã xác nhận'
      });
    }

    // 5. Kiểm tra chuyên môn của nhân viên
    if (employee.specialization !== appointment.category) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Nhân viên không có chuyên môn phù hợp (Yêu cầu: ${appointment.category})`
      });
    }

    // 6. Kiểm tra xung đột lịch làm việc
    const isAvailable = await checkEmployeeAvailability(
      employee_id,
      appointment.appointment_date,
      appointment.appointment_time,
      appointment.duration_minutes,
      id
    );

    if (!isAvailable) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Nhân viên đã có lịch hẹn khác trong khoảng thời gian này'
      });
    }

    // 7. Cập nhật lịch hẹn với nhân viên được phân công
    const result = await client.query(
      `UPDATE appointments
       SET employee_id = $1, 
           status = 'confirmed', 
           updated_at = CURRENT_TIMESTAMP,
           updated_by = $2
       WHERE id = $3
       RETURNING id, appointment_date, appointment_time, status, updated_at`,
      [employee_id, req.user.id, id]
    );

    // 8. Ghi log lịch sử thay đổi
    await client.query(
      `INSERT INTO appointment_logs 
       (appointment_id, action, action_by, old_status, new_status, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'assign_employee',
        req.user.id,
        appointment.status,
        'confirmed',
        JSON.stringify({
          assigned_employee_id: employee_id,
          assigned_employee_name: employee.full_name,
          previous_employee_id: appointment.employee_id
        })
      ]
    );

    // 9. Tạo thông báo
    await notificationController.createNotification({
      receiver_type: 'user',
      receiver_id: appointment.customer_id,
      user_id: appointment.customer_id,
      title: 'Lịch hẹn đã được xác nhận',
      message: `Lịch hẹn cho ${appointment.pet_name} (${appointment.service_name}) đã được xác nhận và phân công cho ${employee.full_name}`,
      type: 'appointment'
    }, client);

    await notificationController.createNotification({
      receiver_type: 'employee',
      receiver_id: employee_id,
      title: 'Bạn có lịch hẹn mới',
      message: `Bạn đã được phân công lịch hẹn #${id} cho ${appointment.customer_name} (${appointment.pet_name}) vào ${appointment.appointment_date.toLocaleDateString('vi-VN')} lúc ${appointment.appointment_time}`,
      type: 'appointment'
    }, client);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Phân công nhân viên thành công',
      data: {
        appointmentId: result.rows[0].id,
        employee: {
          id: employee.employee_id,
          name: employee.full_name,
          specialization: employee.specialization
        },
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi phân công nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi phân công nhân viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Lấy thông tin lịch hẹn hiện tại
    const appointmentResult = await client.query(
      `SELECT a.*, e.employee_id as assigned_employee_id, 
              e.full_name as employee_name, u.full_name as customer_name,
              p.name as pet_name, s.name as service_name
       FROM appointments a
       LEFT JOIN employees e ON a.employee_id = e.employee_id
       JOIN users u ON a.customer_id = u.id
       JOIN pets p ON a.pet_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = $1`,
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointmentResult.rows[0];
    const oldStatus = appointment.status;

    // 2. Kiểm tra quyền
    if (userRole === 'staff' && appointment.employee_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật lịch hẹn này'
      });
    }

    // 3. Kiểm tra chuyển đổi trạng thái hợp lệ
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[oldStatus].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái ${oldStatus} sang ${status}`
      });
    }

    // 4. Cập nhật trạng thái lịch hẹn
    const updateQuery = `
      UPDATE appointments 
      SET status = $1, 
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $2,
          notes = COALESCE($3, notes)
      WHERE id = $4
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      status, 
      userId,
      notes || null,
      id
    ]);

    const updatedAppointment = updateResult.rows[0];

    // 5. Ghi log lịch sử thay đổi
    await client.query(
      `INSERT INTO appointment_logs 
       (appointment_id, action, action_by, old_status, new_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        'status_update',
        userId,
        oldStatus,
        status,
        notes || null
      ]
    );

    // 6. Tạo thông báo nếu cần
    if (status === 'completed') {
      // Tạo hóa đơn khi hoàn thành dịch vụ
      await createInvoiceFromAppointment(client, id, userId);
      
      // Gửi thông báo cho khách hàng
      await notificationController.createNotification({
        receiver_type: 'user',
        receiver_id: appointment.customer_id,
        user_id: appointment.customer_id,
        title: 'Dịch vụ đã hoàn thành',
        message: `Dịch vụ ${appointment.service_name} cho ${appointment.pet_name} đã được hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`,
        type: 'appointment'
      }, client);
    } else if (status === 'cancelled') {
      // Gửi thông báo hủy lịch
      const message = userRole === 'staff' 
        ? `Nhân viên ${req.user.full_name} đã hủy lịch hẹn #${id}`
        : 'Bạn đã hủy lịch hẹn thành công';
      
      await notificationController.createNotification({
        receiver_type: 'user',
        receiver_id: appointment.customer_id,
        user_id: appointment.customer_id,
        title: 'Lịch hẹn đã bị hủy',
        message,
        type: 'appointment'
      }, client);

      if (appointment.assigned_employee_id) {
        await notificationController.createNotification({
          receiver_type: 'employee',
          receiver_id: appointment.assigned_employee_id,
          title: 'Lịch hẹn đã bị hủy',
          message: `Lịch hẹn #${id} cho ${appointment.customer_name} đã bị hủy`,
          type: 'appointment'
        }, client);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Cập nhật trạng thái lịch hẹn thành công',
      data: updatedAppointment
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái lịch hẹn',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Hàm tạo hóa đơn từ lịch hẹn
const createInvoiceFromAppointment = async (client, appointmentId, userId) => {
  // Lấy thông tin lịch hẹn
  const appointmentResult = await client.query(
    `SELECT a.*, s.price, s.name as service_name
     FROM appointments a
     JOIN services s ON a.service_id = s.id
     WHERE a.id = $1`,
    [appointmentId]
  );

  if (appointmentResult.rows.length === 0) {
    throw new Error('Không tìm thấy thông tin lịch hẹn');
  }

  const appointment = appointmentResult.rows[0];
  
  // Tạo số hóa đơn (VD: INV-YYYYMMDD-XXXX)
  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Tính toán giá trị hóa đơn
  const subtotal = appointment.price;
  const taxRate = 0.1; // 10% VAT
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  // Tạo hóa đơn
  const invoiceResult = await client.query(
    `INSERT INTO invoices 
     (appointment_id, customer_id, invoice_number, subtotal, tax_amount, 
      total_amount, payment_status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
     RETURNING id`,
    [
      appointmentId,
      appointment.customer_id,
      invoiceNumber,
      subtotal,
      taxAmount,
      totalAmount,
      userId
    ]
  );

  const invoiceId = invoiceResult.rows[0].id;

  // Thêm chi tiết hóa đơn
  await client.query(
    `INSERT INTO invoice_items 
     (invoice_id, service_id, description, quantity, unit_price, total_price)
     VALUES ($1, $2, $3, 1, $4, $5)`,
    [
      invoiceId,
      appointment.service_id,
      appointment.service_name,
      appointment.price,
      appointment.price
    ]
  );

  return invoiceId;
};

module.exports = {
  assignEmployee: async (req, res) => {
    try {
      await assignEmployee(req, res);
    } catch (error) {
      console.error('Error in assignEmployee:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ nội bộ',
        error: error.message
      });
    }
  },
  updateAppointmentStatus: async (req, res) => {
    try {
      await updateAppointmentStatus(req, res);
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ nội bộ',
        error: error.message
      });
    }
  }
};
