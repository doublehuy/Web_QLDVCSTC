const pool = require('../../config/database');

// Cập nhật trạng thái lịch hẹn
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trạng thái không hợp lệ' 
      });
    }

    // Cập nhật trạng thái lịch hẹn
    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lịch hẹn' 
      });
    }

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Cập nhật trạng thái thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ nội bộ' 
    });
  }
};

// Lấy tất cả lịch hẹn và yêu cầu dịch vụ đặc biệt với phân trang và lọc
exports.getAllAppointments = async (req, res) => {
  console.log('Bắt đầu xử lý yêu cầu lấy danh sách lịch hẹn và yêu cầu dịch vụ');
  console.log('Query params:', req.query);
  
  let client;
  try {
    console.log('Đang kết nối đến database...');
    client = await pool.connect().catch(err => {
      console.error('Lỗi kết nối database:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi kết nối cơ sở dữ liệu',
        error: err.message
      });
    });
    
    if (!client) {
      console.error('Không thể kết nối đến database');
      return;
    }
    
    console.log('Đã kết nối database thành công');
    // Lấy tham số phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Lấy tham số lọc
    const { status, date_from, date_to, customer_name } = req.query;

    // Bắt đầu transaction
    await client.query('BEGIN');

    // Tạo câu truy vấn kết hợp dữ liệu từ cả hai bảng
    let query = `
      -- Lấy dữ liệu từ bảng appointments
      SELECT 
        a.id,
        u.id as customer_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at,
        a.employee_id,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        e.full_name as employee_name,
        e.phone as employee_phone,
        s.name as service_name,
        p.name as pet_name,
        p.species as pet_species,
        p.id as pet_id,
        s.id as service_id,
        NULL as special_requirements,
        NULL as admin_notes,
        'appointment' as request_type
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN users e ON a.employee_id = e.id
      LEFT JOIN services s ON a.service_id = s.id
      
      UNION ALL
      
      -- Lấy dữ liệu từ bảng custom_service_requests
      SELECT 
        csr.id,
        csr.user_id as customer_id,
        NULL as appointment_date,
        NULL as appointment_time,
        csr.status,
        csr.description as notes,
        csr.created_at,
        csr.updated_at,
        csr.assigned_employee_id as employee_id,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        e.full_name as employee_name,
        e.phone as employee_phone,
        csr.service_name,
        NULL as pet_name,
        NULL as pet_species,
        NULL as pet_id,
        NULL as service_id,
        csr.special_requirements,
        csr.admin_notes,
        'custom_service' as request_type
      FROM custom_service_requests csr
      LEFT JOIN users u ON csr.user_id = u.id
      LEFT JOIN users e ON csr.assigned_employee_id = e.id
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    // Thực hiện truy vấn
    const result = await client.query(query, [limit, offset]);
    
    // Đếm tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM (
        SELECT id FROM appointments
        UNION ALL
        SELECT id FROM custom_service_requests
      ) as combined
    `;
    
    const countResult = await client.query(countQuery);
    const total = parseInt(countResult.rows[0].total_count);

    // Commit transaction
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Đã xảy ra lỗi trong quá trình xử lý:');
    console.error('Tên lỗi:', error.name);
    console.error('Thông điệp lỗi:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Rollback transaction nếu có lỗi
    if (client) {
      console.log('Đang thực hiện rollback transaction...');
      try {
        await client.query('ROLLBACK');
        console.log('Đã rollback transaction thành công');
      } catch (rollbackError) {
        console.error('Lỗi khi rollback transaction:', rollbackError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi lấy danh sách lịch hẹn: ' + error.message,
      error: {
        name: error.name,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  } finally {
    // Giải phóng client về pool
    if (client && typeof client.release === 'function') {
      try {
        await client.release();
      } catch (releaseError) {
        console.error('Lỗi khi giải phóng kết nối:', releaseError);
      }
    }
  }
};

// Cập nhật nhân viên cho lịch hẹn hoặc yêu cầu dịch vụ
exports.assignEmployee = async (req, res) => {
  const { id } = req.params;
  // Frontend đang gửi employee_id, giữ tương thích với cả employeeId nếu có
  const { employee_id, employeeId, requestType = 'appointment' } = req.body;

  const effectiveEmployeeId = employee_id || employeeId;

  if (!effectiveEmployeeId) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp ID nhân viên'
    });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Kiểm tra xem nhân viên có tồn tại không (bảng employees)
    const employeeCheck = await client.query(
      'SELECT * FROM employees WHERE employee_id = $1',
      [effectiveEmployeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    let result;
    
    if (requestType === 'custom_service') {
      // Cập nhật nhân viên cho yêu cầu dịch vụ đặc biệt
      // Sử dụng status 'in_progress' (trạng thái hợp lệ theo controller admin)
      result = await client.query(
        `UPDATE custom_service_requests 
         SET assigned_employee_id = $1, status = 'in_progress', updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [effectiveEmployeeId, id]
      );
      
      if (result.rows.length > 0) {
        // Lấy thông tin chi tiết để trả về
        const detailQuery = `
          SELECT 
            csr.*,
            u.full_name as customer_name,
            u.phone as customer_phone,
            u.email as customer_email,
            e.full_name as employee_name,
            e.phone as employee_phone
          FROM custom_service_requests csr
          LEFT JOIN users u ON csr.user_id = u.id
          LEFT JOIN employees e ON csr.assigned_employee_id = e.employee_id
          WHERE csr.id = $1
        `;
        const detailResult = await client.query(detailQuery, [id]);
        result.rows[0] = { ...result.rows[0], ...detailResult.rows[0], request_type: 'custom_service' };
      }
    } else {
      // Cập nhật nhân viên cho lịch hẹn thông thường
      // Dùng status 'confirmed' để phù hợp với check constraint và UI
      result = await client.query(
        `UPDATE appointments 
         SET employee_id = $1, status = 'confirmed', updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [effectiveEmployeeId, id]
      );
      
      if (result.rows.length > 0) {
        // Lấy thông tin chi tiết để trả về
        const detailQuery = `
          SELECT 
            a.*,
            u.full_name as customer_name,
            u.phone as customer_phone,
            u.email as customer_email,
            e.full_name as employee_name,
            e.phone as employee_phone,
            s.name as service_name,
            p.name as pet_name,
            p.species as pet_species
          FROM appointments a
          LEFT JOIN pets p ON a.pet_id = p.id
          LEFT JOIN users u ON p.owner_id = u.id
          LEFT JOIN employees e ON a.employee_id = e.employee_id
          LEFT JOIN services s ON a.service_id = s.id
          WHERE a.id = $1
        `;
        const detailResult = await client.query(detailQuery, [id]);
        result.rows[0] = { ...result.rows[0], ...detailResult.rows[0], request_type: 'appointment' };
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy ${requestType === 'custom_service' ? 'yêu cầu dịch vụ' : 'lịch hẹn'}`
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: `Đã phân công nhân viên thành công cho ${requestType === 'custom_service' ? 'yêu cầu dịch vụ' : 'lịch hẹn'}`
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Lỗi khi phân công nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ nội bộ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};
