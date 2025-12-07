const pool = require('../config/database');
const notificationController = require('./notificationController');

const employeeController = {
  // Lấy danh sách yêu cầu được phân công cho nhân viên (dựa trên bảng trung gian)
  getAssignedAppointments: async (req, res) => {
    try {
      const employeeId = req.user.employee_id;

      const result = await pool.query(
        `SELECT csr.id, csr.service_name, csr.description, csr.special_requirements,
                csr.status, csr.admin_notes, csr.created_at, csr.updated_at,
                csr.completed_at, csr.service_type, csr.pet_id,
                u.full_name AS customer_name,
                u.phone AS customer_phone,
                u.email AS customer_email,
                p.name AS pet_name,
                p.species AS pet_species,
                p.breed AS pet_breed,
                cse.status AS employee_assignment_status
         FROM custom_service_requests csr
         JOIN custom_service_request_employees cse ON cse.request_id = csr.id
         JOIN users u ON csr.user_id = u.id
         LEFT JOIN pets p ON csr.pet_id = p.id
         WHERE cse.employee_id = $1
           AND cse.status IN ('pending_employee_confirmation', 'in_progress')
           AND csr.status IN ('pending_employee_confirmation', 'in_progress')
         ORDER BY csr.created_at DESC`,
        [employeeId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting assigned appointments:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lịch hẹn' });
    }
  },

  // Xác nhận nhận việc
  confirmAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const employeeId = req.user.employee_id;
      
      // Kiểm tra xem lịch hẹn có thuộc về nhân viên này không
      const checkRequest = await pool.query(
        'SELECT * FROM custom_service_requests WHERE id = $1 AND assigned_employee_id = $2',
        [id, employeeId]
      );

      if (checkRequest.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
      }

      // Đổi trạng thái yêu cầu chính sang in_progress
      await pool.query(
        `UPDATE custom_service_requests 
         SET status = 'in_progress', updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      // Cập nhật trạng thái trong bảng trung gian cho nhân viên đang xác nhận
      await pool.query(
        `UPDATE custom_service_request_employees
         SET status = 'in_progress', updated_at = NOW()
         WHERE request_id = $1 AND employee_id = $2`,
        [id, employeeId]
      );

      res.json({ success: true, message: 'Đã xác nhận nhận việc thành công' });
    } catch (error) {
      console.error('Error confirming appointment:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi xác nhận lịch hẹn' });
    }
  },

  // Nhân viên chấp nhận yêu cầu
  acceptAssignedRequest: async (req, res) => {
    try {
      const { id } = req.params; // request_id
      const employeeId = req.user.employee_id;

      // Lấy thông tin yêu cầu + customer, đảm bảo còn phân công cho nhân viên này
      const checkRequest = await pool.query(
        `SELECT csr.*, u.full_name AS customer_name
         FROM custom_service_requests csr
         JOIN users u ON csr.user_id = u.id
         JOIN custom_service_request_employees cse
           ON cse.request_id = csr.id AND cse.employee_id = $2
         WHERE csr.id = $1`,
        [id, employeeId]
      );

      if (checkRequest.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hoặc bạn không được phân công' });
      }

      const request = checkRequest.rows[0];

      if (request.status !== 'pending_employee_confirmation') {
        return res.status(400).json({ success: false, message: 'Yêu cầu không ở trạng thái chờ xác nhận' });
      }

      // 1) Đổi trạng thái yêu cầu chính sang in_progress và gán nhân viên này làm assigned_employee_id
      await pool.query(
        `UPDATE custom_service_requests 
         SET status = 'in_progress', assigned_employee_id = $2, updated_at = NOW()
         WHERE id = $1`,
        [id, employeeId]
      );

      // 2) Cập nhật dòng phân công của nhân viên này sang in_progress
      await pool.query(
        `UPDATE custom_service_request_employees
         SET status = 'in_progress', updated_at = NOW()
         WHERE request_id = $1 AND employee_id = $2`,
        [id, employeeId]
      );

      // 3) Các nhân viên khác cùng request không còn chờ xác nhận nữa
      await pool.query(
        `UPDATE custom_service_request_employees
         SET status = 'cancelled', updated_at = NOW()
         WHERE request_id = $1 AND employee_id <> $2 AND status = 'pending_employee_confirmation'`,
        [id, employeeId]
      );

      // 4) Tạo lịch hẹn cho khách hàng với nhân viên vừa nhận việc
      try {
        // Cố gắng map service_type/service_name sang services.id
        let serviceId = null;
        const serviceKey = request.service_type || request.service_name;
        if (serviceKey) {
          const serviceResult = await pool.query(
            'SELECT id FROM services WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [serviceKey]
          );
          if (serviceResult.rows.length > 0) {
            serviceId = serviceResult.rows[0].id;
          }
        }

        if (serviceId) {
          const appointmentDate = request.start_date ? request.start_date : new Date().toISOString().slice(0, 10);
          const appointmentTime = '09:00:00';

          await pool.query(
            `INSERT INTO appointments 
             (customer_id, pet_id, service_id, appointment_date, appointment_time, status, notes, employee_id)
             VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)`,
            [
              request.user_id,
              request.pet_id,
              serviceId,
              appointmentDate,
              appointmentTime,
              request.description,
              employeeId
            ]
          );
        } else {
          console.warn('Không tìm thấy service tương ứng để tạo lịch hẹn cho custom request', {
            request_id: id,
            service_type: request.service_type,
            service_name: request.service_name
          });
        }
      } catch (aptError) {
        console.error('Lỗi khi tạo lịch hẹn từ yêu cầu dịch vụ đặc thù:', aptError);
      }

      try {
        await notificationController.createNotification({
          receiver_type: 'user',
          receiver_id: request.user_id,
          user_id: request.user_id,
          title: 'Yêu cầu đã được nhân viên xác nhận',
          message: `Nhân viên phụ trách đã xác nhận xử lý yêu cầu "${request.service_name}" của bạn.`,
          type: 'info'
        });

        await notificationController.createNotification({
          receiver_type: 'admin',
          receiver_id: 0,
          title: 'Nhân viên đã xác nhận yêu cầu',
          message: `Nhân viên đã xác nhận yêu cầu "${request.service_name}" của khách hàng ${request.customer_name}.`,
          type: 'info'
        });

        // Gửi thông báo cho các nhân viên khác rằng công việc đã có người nhận
        const otherEmployees = await pool.query(
          `SELECT employee_id 
           FROM custom_service_request_employees 
           WHERE request_id = $1 AND employee_id <> $2 AND status = 'cancelled'`,
          [id, employeeId]
        );

        for (const row of otherEmployees.rows) {
          await notificationController.createNotification({
            receiver_type: 'employee',
            receiver_id: row.employee_id,
            title: 'Công việc đã có người nhận',
            message: `Yêu cầu "${request.service_name}" đã được một nhân viên khác xác nhận, bạn không cần xử lý nữa.`,
            type: 'info'
          });
        }
      } catch (notifyError) {
        console.error('Error sending accept notifications:', notifyError);
        // Không throw để tránh làm fail API nếu chỉ lỗi thông báo
      }

      res.json({ success: true, message: 'Đã xác nhận nhận yêu cầu' });
    } catch (error) {
      console.error('Error accepting request:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi xác nhận yêu cầu' });
    }
  },

  rejectAssignedRequest: async (req, res) => {
    try {
      const { id } = req.params; // request_id
      const employeeId = req.user.employee_id;

      const checkRequest = await pool.query(
        `SELECT csr.*, u.full_name AS customer_name
         FROM custom_service_requests csr
         JOIN users u ON csr.user_id = u.id
         JOIN custom_service_request_employees cse
           ON cse.request_id = csr.id AND cse.employee_id = $2
         WHERE csr.id = $1`,
        [id, employeeId]
      );

      if (checkRequest.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hoặc bạn không được phân công' });
      }

      const request = checkRequest.rows[0];

      if (request.status !== 'pending_employee_confirmation') {
        return res.status(400).json({ success: false, message: 'Yêu cầu không ở trạng thái chờ xác nhận' });
      }

      // 1) Đánh dấu dòng phân công của nhân viên này là rejected
      await pool.query(
        `UPDATE custom_service_request_employees
         SET status = 'rejected', updated_at = NOW()
         WHERE request_id = $1 AND employee_id = $2`,
        [id, employeeId]
      );

      // 2) Kiểm tra còn nhân viên nào khác đang ở trạng thái pending_employee_confirmation không
      const pendingOthers = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM custom_service_request_employees
         WHERE request_id = $1 AND status = 'pending_employee_confirmation'`,
        [id]
      );

      const remainPending = parseInt(pendingOthers.rows[0].cnt, 10);

      if (remainPending === 0) {
        // Không còn ai chờ xác nhận -> trả yêu cầu về cho admin
        await pool.query(
          `UPDATE custom_service_requests 
           SET status = 'pending', assigned_employee_id = NULL, updated_at = NOW()
           WHERE id = $1`,
          [id]
        );

        try {
          await notificationController.createNotification({
            receiver_type: 'user',
            receiver_id: request.user_id,
            user_id: request.user_id,
            title: 'Yêu cầu đang chờ phân công lại',
            message: `Tất cả nhân viên được phân công đã từ chối yêu cầu "${request.service_name}". Bộ phận quản lý sẽ sớm phân công nhân viên khác.`,
            type: 'info'
          });

          await notificationController.createNotification({
            receiver_type: 'admin',
            receiver_id: 0,
            title: 'Yêu cầu bị từ chối bởi tất cả nhân viên',
            message: `Tất cả nhân viên được phân công đã từ chối yêu cầu "${request.service_name}" của khách hàng ${request.customer_name}. Vui lòng phân công lại.`,
            type: 'info'
          });
        } catch (notifyError) {
          console.error('Error sending reject-all notifications:', notifyError);
        }
      } else {
        // Vẫn còn nhân viên khác đang chờ xác nhận -> không đổi status tổng thể
        try {
          await notificationController.createNotification({
            receiver_type: 'admin',
            receiver_id: 0,
            title: 'Một nhân viên đã từ chối yêu cầu',
            message: `Một nhân viên đã từ chối yêu cầu "${request.service_name}" của khách hàng ${request.customer_name}, vẫn còn nhân viên khác đang chờ xác nhận.`,
            type: 'info'
          });
        } catch (notifyError) {
          console.error('Error sending partial-reject notification:', notifyError);
        }
      }

      res.json({ success: true, message: 'Đã từ chối yêu cầu' });
    } catch (error) {
      console.error('Error rejecting request:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi từ chối yêu cầu' });
    }
  },

  // Lấy thông báo của nhân viên
  getNotifications: async (req, res) => {
    try {
      const employeeId = req.user.employee_id;
      
      const result = await pool.query(
        `SELECT id, title, message, type, is_read, created_at
         FROM notifications 
         WHERE receiver_type = 'employee' AND receiver_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [employeeId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo' });
    }
  },

  // Đánh dấu thông báo đã đọc
  markNotificationAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      
      await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
        [id]
      );

      res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái thông báo' });
    }
  }
};
// Lấy lịch hẹn của nhân viên theo ngày
const getEmployeeAppointments = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const { date } = req.query;

    let query = `
      SELECT a.*, 
             u.full_name AS customer_name,
             u.phone AS customer_phone,
             p.name AS pet_name,
             p.breed AS pet_breed,
             s.name AS service_name
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.employee_id = $1
    `;

    const params = [employeeId];

    if (date) {
      query += ' AND a.appointment_date = $2';
      params.push(date);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const result = await pool.query(query, params);

    const data = result.rows.map((row) => ({
      id: row.id,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      status: row.status,
      notes: row.notes,
      user: {
        name: row.customer_name,
        phone: row.customer_phone
      },
      pet: row.pet_id
        ? {
            name: row.pet_name,
            breed: row.pet_breed
          }
        : null,
      service: {
        name: row.service_name
      }
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting employee appointments:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch làm việc của nhân viên' });
  }
};

// Thêm hàm này vào cuối file, trước dòng module.exports
const getEmployeesBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    
    const query = `
      SELECT * FROM employees 
      WHERE LOWER(TRIM(specialization)) = LOWER(TRIM($1)) 
      AND status = 'active'
      ORDER BY full_name
    `;
    
    const { rows } = await db.query(query, [specialization.trim()]);
    res.json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân viên:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhân viên' });
  }
};

// Cập nhật dòng module.exports cuối cùng thành:
module.exports = {
  ...employeeController,
  getEmployeeAppointments,
  getEmployeesBySpecialization
};

// module.exports = employeeController;
