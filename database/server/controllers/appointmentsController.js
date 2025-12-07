const pool = require('../config/database');

// Map service name -> nhóm chuyên môn nhân viên (đồng bộ với phía frontend AdminAppointments)
const normalizeText = (text = '') => text.toLowerCase().trim();

const SERVICE_SPECIALIZATION_MAP = {
  'khám bệnh': 'khám bệnh',
  'khám sức khỏe tổng quát': 'khám bệnh',
  'chụp x-quang': 'khám bệnh',
  'xét nghiệm máu': 'khám bệnh',
  'tư vấn dinh dưỡng': 'khám bệnh',
  'tiểu phẫu': 'phẫu thuật',
  'phẫu thuật': 'phẫu thuật',
  'phẫu thuật nhỏ': 'phẫu thuật',
  'phẫu thuật nâng cao': 'phẫu thuật',
  'tiêm phòng': 'tiêm phòng',
  'tiêm phòng cơ bản': 'tiêm phòng',
  'tiêm phòng nâng cao': 'tiêm phòng',
  'cắt tỉa': 'cắt tỉa',
  'tắm và cắt tỉa lông': 'cắt tỉa',
  'spa': 'spa',
  'spa thú cưng': 'spa',
  'gửi thú cưng qua đêm': 'spa',
  'chăm sóc thú cưng': 'khám bệnh',
  'huấn luyện': 'huấn luyện',
  'đào tạo': 'huấn luyện'
};

const mapServiceNameToSpecialization = (serviceName = '') => {
  const normalized = normalizeText(serviceName);
  return SERVICE_SPECIALIZATION_MAP[normalized] || normalized;
};

// Lấy danh sách lịch hẹn của user hiện tại
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT a.*, 
             s.name as service_name, s.price as service_price,
             p.name as pet_name, p.species as pet_species,
             e.full_name as employee_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN pets p ON a.pet_id = p.id
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.customer_id = $1
    `;
    
    const params = [userId];
    
    if (status) {
      query += ' AND a.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    const result = await pool.query(query, params);
    
    // Format dữ liệu trả về
    const appointments = result.rows.map(apt => ({
      id: apt.id,
      petName: apt.pet_name,
      service: apt.service_name,
      date: apt.appointment_date,
      time: apt.appointment_time,
      status: apt.status,
      price: apt.total_price || apt.service_price,
      location: 'Chi nhánh chính',
      phone: apt.phone || '0123456789',
      notes: apt.notes,
      doctor: apt.employee_name || 'Chưa phân công',
      createdAt: apt.created_at,
      updatedAt: apt.updated_at
    }));
    
    res.json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn'
    });
  }
};

// Lấy thông tin lịch hẹn theo ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = `
      SELECT a.*, s.name as service_name, s.price as service_price,
             p.name as pet_name, p.species as pet_species,
             u.full_name as customer_name, u.phone as customer_phone,
             e.full_name as employee_name, e.specialization as employee_specialization
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN pets p ON a.pet_id = p.id
      JOIN users u ON a.customer_id = u.id
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.id = $1
    `;
    
    const params = [id];
    
    if (!isAdmin) {
      query += ' AND a.customer_id = $2';
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }
    
    const appointment = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: appointment.id,
        petName: appointment.pet_name,
        service: appointment.service_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status,
        price: appointment.total_price || appointment.service_price,
        customerName: appointment.customer_name,
        customerPhone: appointment.customer_phone,
        notes: appointment.notes,
        employeeName: appointment.employee_name || 'Chưa phân công',
        employeeSpecialization: appointment.employee_specialization,
        employeeId: appointment.employee_id,
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin lịch hẹn'
    });
  }
};

// Tạo lịch hẹn mới
const createAppointment = async (req, res) => {
  try {
    const { pet_id, service_id, appointment_date, appointment_time, notes } = req.body;
    const userId = req.user.id;

    // Kiểm tra thông tin bắt buộc
    if (!pet_id || !service_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Kiểm tra xem pet có thuộc về user không
    const petCheck = await pool.query(
      'SELECT * FROM pets WHERE id = $1 AND owner_id = $2',
      [pet_id, userId]
    );

    if (petCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thú cưng không tồn tại hoặc không thuộc quyền sở hữu của bạn'
      });
    }

    // Kiểm tra xem service có tồn tại không
    const serviceCheck = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [service_id]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dịch vụ không tồn tại'
      });
    }

    const service = serviceCheck.rows[0];

    // Xác định nhóm chuyên môn mong muốn dựa trên tên dịch vụ
    const desiredSpecialization = mapServiceNameToSpecialization(service.name);

    // Mặc định: trạng thái pending và chưa có nhân viên
    // (UI user và admin đang dùng các status tiếng Anh: pending, confirmed, completed, cancelled)
    let assignedEmployeeId = null;
    let appointmentStatus = 'pending';

    try {
      // Tìm nhân viên có chuyên môn phù hợp và đang làm
      const employeesRes = await pool.query(
        'SELECT employee_id FROM employees WHERE specialization = $1 AND status = $2',
        [desiredSpecialization, 'đang làm']
      );

      if (employeesRes.rows.length > 0) {
        // Random chọn 1 nhân viên phù hợp
        const randomIndex = Math.floor(Math.random() * employeesRes.rows.length);
        assignedEmployeeId = employeesRes.rows[randomIndex].employee_id;
        // Nếu đã tự gán được nhân viên thì coi như lịch đã được xác nhận
        appointmentStatus = 'confirmed';
      }
    } catch (err) {
      console.error('Lỗi khi tự động phân công nhân viên:', err);
      // Nếu có lỗi khi chọn nhân viên, vẫn tạo lịch hẹn với trạng thái pending
      assignedEmployeeId = null;
      appointmentStatus = 'pending';
    }

    // Tạo lịch hẹn mới
    const result = await pool.query(
      `INSERT INTO appointments 
       (customer_id, pet_id, service_id, appointment_date, appointment_time, notes, status, employee_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        pet_id,
        service_id,
        appointment_date,
        appointment_time,
        notes || null,
        appointmentStatus,
        assignedEmployeeId
      ]
    );

    const newAppointment = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Đặt lịch hẹn thành công',
      data: {
        id: newAppointment.id,
        status: newAppointment.status,
        date: newAppointment.appointment_date,
        time: newAppointment.appointment_time,
        notes: newAppointment.notes,
        createdAt: newAppointment.created_at
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo lịch hẹn'
    });
  }
};

// Cập nhật lịch hẹn
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { appointment_date, appointment_time, notes } = req.body;

    // Kiểm tra xem lịch hẹn có tồn tại và thuộc về user không
    const appointmentCheck = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND customer_id = $2',
      [id, userId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền chỉnh sửa'
      });
    }

    const appointment = appointmentCheck.rows[0];

    // Chỉ cho phép cập nhật nếu lịch hẹn đang ở trạng thái chờ hoặc đã xác nhận
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật lịch hẹn đang chờ xử lý hoặc đã xác nhận'
      });
    }

    // Cập nhật lịch hẹn
    const result = await pool.query(
      `UPDATE appointments 
       SET appointment_date = COALESCE($1, appointment_date),
           appointment_time = COALESCE($2, appointment_time),
           notes = COALESCE($3, notes, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND customer_id = $5
       RETURNING *`,
      [
        appointment_date || null,
        appointment_time || null,
        notes !== undefined ? notes : appointment.notes,
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn để cập nhật'
      });
    }

    const updatedAppointment = result.rows[0];

    res.json({
      success: true,
      message: 'Cập nhật lịch hẹn thành công',
      data: {
        id: updatedAppointment.id,
        date: updatedAppointment.appointment_date,
        time: updatedAppointment.appointment_time,
        notes: updatedAppointment.notes,
        status: updatedAppointment.status,
        updatedAt: updatedAppointment.updated_at
      }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật lịch hẹn'
    });
  }
};

// Hủy lịch hẹn
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    // Kiểm tra xem lịch hẹn có tồn tại và thuộc về user không
    const appointmentCheck = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND customer_id = $2',
      [id, userId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền hủy'
      });
    }

    const appointment = appointmentCheck.rows[0];

    // Chỉ cho phép hủy nếu lịch hẹn đang ở trạng thái chờ hoặc đã xác nhận
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy lịch hẹn đang chờ xử lý hoặc đã xác nhận'
      });
    }

    // Lý do hủy là bắt buộc
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do hủy lịch hẹn'
      });
    }

    // Cập nhật trạng thái lịch hẹn thành đã hủy và lưu lý do
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           cancel_reason = $1,
           cancelled_by = 'user',
           cancelled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND customer_id = $3
       RETURNING *`,
      [reason.trim(), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn để hủy'
      });
    }

    const cancelledAppointment = result.rows[0];

    // Gửi thông báo cho chính user về việc đã hủy lịch
    await createNotification(
      userId,
      'Đã hủy lịch hẹn',
      `Bạn đã hủy lịch hẹn #${id}`,
      'appointment',
      id
    );

    // Gửi thông báo cho nhân viên nếu đã được phân công
    if (appointment.employee_id) {
      await createNotification(
        appointment.employee_id,
        'Lịch hẹn đã bị hủy',
        `Lịch hẹn #${id} đã bị hủy bởi khách hàng`,
        'appointment',
        id
      );
    }

    res.json({
      success: true,
      message: 'Hủy lịch hẹn thành công',
      data: {
        id: cancelledAppointment.id,
        status: cancelledAppointment.status,
        cancelReason: cancelledAppointment.cancel_reason,
        cancelledAt: cancelledAppointment.cancelled_at,
        updatedAt: cancelledAppointment.updated_at
      }
    });
  } catch (error) {
    console.error('Lỗi khi hủy lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy lịch hẹn'
    });
  }
};

// Lấy danh sách lịch trống
const getAvailableSlots = async (req, res) => {
  try {
    const { date, service_id } = req.query;

    if (!date || !service_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày và mã dịch vụ'
      });
    }

    // Lấy thông tin dịch vụ để biết thời gian thực hiện
    const serviceResult = await pool.query(
      'SELECT duration_minutes FROM services WHERE id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    const duration = serviceResult.rows[0].duration_minutes || 60; // Mặc định 60 phút

    // Lấy các khung giờ đã đặt trong ngày
    const appointmentsResult = await pool.query(
      `SELECT appointment_time, duration_minutes 
       FROM appointments 
       WHERE appointment_date = $1 
       AND status IN ('pending', 'confirmed', 'in_progress')`,
      [date]
    );

    // Tạo danh sách giờ làm việc (8:00 - 17:00)
    const workingHours = [];
    for (let hour = 8; hour < 17; hour++) {
      workingHours.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: true
      });
    }

    // Đánh dấu các khung giờ đã đặt
    const bookedSlots = appointmentsResult.rows.map(apt => {
      const startTime = new Date(`2000-01-01T${apt.appointment_time}`);
      const endTime = new Date(startTime.getTime() + (apt.duration_minutes || 60) * 60000);
      
      return {
        start: startTime,
        end: endTime
      };
    });

    // Kiểm tra từng khung giờ
    const availableSlots = workingHours.map(slot => {
      const slotTime = new Date(`2000-01-01T${slot.time}`);
      const slotEndTime = new Date(slotTime.getTime() + duration * 60000);
      
      // Kiểm tra xem khung giờ có bị trùng không
      const isBooked = bookedSlots.some(booked => {
        return (
          (slotTime >= booked.start && slotTime < booked.end) ||
          (slotEndTime > booked.start && slotEndTime <= booked.end) ||
          (slotTime <= booked.start && slotEndTime >= booked.end)
        );
      });
      
      return {
        time: slot.time,
        available: !isBooked
      };
    });

    res.json({
      success: true,
      data: availableSlots.filter(slot => slot.available)
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch trống:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch trống'
    });
  }
};

// Lấy tất cả lịch hẹn (cho admin)
const getAllAppointments = async (req, res) => {
  try {
    const { status, date_from, date_to, employee_id } = req.query;
    
    let query = `
      SELECT a.*, 
             s.name as service_name, s.price as service_price,
             p.name as pet_name, p.species as pet_species,
             u.full_name as customer_name, u.phone as customer_phone,
             e.full_name as employee_name, e.specialization as employee_specialization
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN pets p ON a.pet_id = p.id
      JOIN users u ON a.customer_id = u.id
      LEFT JOIN employees e ON a.employee_id = e.employee_id
    `;
    
    const conditions = [];
    const params = [];
    
    // Thêm điều kiện lọc
    if (status) {
      conditions.push(`a.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (date_from) {
      conditions.push(`a.appointment_date >= $${params.length + 1}`);
      params.push(date_from);
    }
    
    if (date_to) {
      conditions.push(`a.appointment_date <= $${params.length + 1}`);
      params.push(date_to);
    }
    
    if (employee_id) {
      conditions.push(`a.employee_id = $${params.length + 1}`);
      params.push(employee_id);
    }
    
    // Thêm điều kiện vào câu truy vấn
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sắp xếp theo thời gian gần nhất
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    const result = await pool.query(query, params);
    
    // Format dữ liệu trả về
    const appointments = result.rows.map(apt => ({
      id: apt.id,
      petName: apt.pet_name,
      service: apt.service_name,
      date: apt.appointment_date,
      time: apt.appointment_time,
      status: apt.status,
      price: apt.total_price || apt.service_price,
      customerName: apt.customer_name,
      customerPhone: apt.customer_phone,
      notes: apt.notes,
      employeeName: apt.employee_name || 'Chưa phân công',
      employeeSpecialization: apt.employee_specialization,
      employeeId: apt.employee_id,
      createdAt: apt.created_at,
      updatedAt: apt.updated_at
    }));
    
    res.json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lịch hẹn'
    });
  }
};

// Hàm tạo thông báo
const createNotification = async (userId, title, message, type, referenceId) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, reference_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, title, message, type, referenceId]
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo:', error);
  }
};

// Phân công nhân viên cho lịch hẹn
const assignEmployee = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    const updatedBy = req.user.id;

    // Kiểm tra quyền admin/staff
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện thao tác này'
      });
    }

    // Bắt đầu transaction
    await client.query('BEGIN');

    // 1. Kiểm tra xem lịch hẹn có tồn tại không
    const appointmentRes = await client.query(
      'SELECT * FROM appointments WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (appointmentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointmentRes.rows[0];

    // 2. Kiểm tra xem nhân viên có tồn tại và có sẵn sàng không
    const employeeRes = await client.query(
      'SELECT * FROM employees WHERE id = $1 AND status = $2',
      [employeeId, 'active']
    );

    if (employeeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Nhân viên không tồn tại hoặc không khả dụng'
      });
    }

    // 3. Cập nhật lịch hẹn với nhân viên mới
    const updateRes = await client.query(
      `UPDATE appointments 
       SET employee_id = $1, 
           status = 'assigned', 
           updated_at = NOW(),
           updated_by = $2
       WHERE id = $3
       RETURNING *`,
      [employeeId, updatedBy, id]
    );

    // 4. Tạo thông báo cho khách hàng
    await createNotification(
      appointment.customer_id,
      'Đã phân công nhân viên',
      `Lịch hẹn #${id} của bạn đã được phân công cho nhân viên mới`,
      'appointment',
      id
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Phân công nhân viên thành công',
      data: updateRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi phân công nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân công nhân viên',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const updatedBy = req.user.id;

    // Kiểm tra quyền
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện thao tác này'
      });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    await client.query('BEGIN');

    // 1. Lấy thông tin lịch hẹn hiện tại
    const appointmentRes = await client.query(
      'SELECT * FROM appointments WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (appointmentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const appointment = appointmentRes.rows[0];

    // 2. Cập nhật trạng thái
    const updateRes = await client.query(
      `UPDATE appointments 
       SET status = $1,
           notes = COALESCE($2, notes),
           updated_at = NOW(),
           updated_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, notes, updatedBy, id]
    );

    // 3. Tạo thông báo cho khách hàng
    const statusMessages = {
      'confirmed': 'đã được xác nhận',
      'in_progress': 'đang được thực hiện',
      'completed': 'đã hoàn thành',
      'cancelled': 'đã bị hủy'
    };

    if (statusMessages[status]) {
      await createNotification(
        appointment.customer_id,
        `Lịch hẹn ${statusMessages[status]}`,
        `Lịch hẹn #${id} của bạn ${statusMessages[status]}`,
        'appointment',
        id
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Cập nhật trạng thái lịch hẹn thành ${status}`,
      data: updateRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái lịch hẹn',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getUserAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
  getAllAppointments,
  assignEmployee,
  updateAppointmentStatus
};
