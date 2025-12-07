const pool = require('../../config/database');
const notificationController = require('../notificationController');

// Lấy tất cả yêu cầu dịch vụ tùy chỉnh với phân trang và lọc
exports.getAllCustomServiceRequests = async (req, res) => {
  console.log('=== BẮT ĐẦU XỬ LÝ YÊU CẦU ===');
  console.log('URL:', req.originalUrl);
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  
  let client;
  try {
    console.log('\n1. Đang kết nối database...');
    client = await pool.connect();
    console.log('✅ Đã kết nối database thành công');

    // Lấy tham số phân trang và lọc
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, date_from, date_to, search } = req.query;
    
    console.log('\n2. Tham số nhận được:');
    console.log('- page:', page, '(', typeof page, ')');
    console.log('- limit:', limit, '(', typeof limit, ')');
    console.log('- status:', status, '(', typeof status, ')');

    // Bắt đầu transaction
    await client.query('BEGIN');

    // Tạo câu truy vấn cơ bản
    console.log('\n3. Tạo câu truy vấn cơ bản');
    let query = `
      SELECT 
        csr.*,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        COALESCE(
          array_agg(DISTINCT cse.employee_id) FILTER (WHERE cse.employee_id IS NOT NULL),
          ARRAY[]::INTEGER[]
        ) AS employee_ids
      FROM custom_service_requests csr
      LEFT JOIN users u ON csr.user_id = u.id
      LEFT JOIN custom_service_request_employees cse ON cse.request_id = csr.id
    `;

    // Tạo mảng điều kiện
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // Thêm điều kiện mặc định nếu không có status
    if (!status) {
      conditions.push(`(csr.status != 'completed' AND csr.status != 'rejected')`);
    }

    // Thêm điều kiện lọc theo status
    if (status) {
      conditions.push(`csr.status = $${paramIndex++}`);
      params.push(status);
      console.log(`- Đã thêm điều kiện lọc status: ${status}`);
    }

    if (date_from) {
      conditions.push(`csr.created_at >= $${paramIndex++}`);
      params.push(date_from);
      console.log(`- Đã thêm điều kiện lọc từ ngày: ${date_from}`);
    }

    if (date_to) {
      const endOfDay = date_to + ' 23:59:59';
      conditions.push(`csr.created_at <= $${paramIndex++}`);
      params.push(endOfDay);
      console.log(`- Đã thêm điều kiện lọc đến ngày: ${endOfDay}`);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(`(
        csr.service_name ILIKE $${paramIndex} OR 
        u.full_name ILIKE $${paramIndex} OR
        u.phone ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex}
      )`);
      params.push(searchTerm);
      paramIndex++;
      console.log(`- Đã thêm điều kiện tìm kiếm: ${searchTerm}`);
    }

    // Tạo câu truy vấn đếm
    console.log('\n4. Tạo câu truy vấn đếm tổng số bản ghi');
    let countQuery = `
      SELECT COUNT(*) as total
      FROM custom_service_requests csr
      LEFT JOIN users u ON csr.user_id = u.id
    `;
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    console.log('\n5. Thực hiện đếm tổng số bản ghi');
    console.log('Count Query:', countQuery);
    console.log('Count Params:', JSON.stringify(params, null, 2));
    
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    console.log(`✅ Tổng số bản ghi: ${total}`);

    // Thêm điều kiện vào câu truy vấn chính
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Group theo csr và thông tin customer để dùng được array_agg
    query += `
      GROUP BY 
        csr.id,
        u.full_name,
        u.phone,
        u.email
    `;

    // Thêm phân trang và sắp xếp
    const offset = (page - 1) * limit;
    query += ` 
      ORDER BY csr.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    
    params.push(limit, offset);
    
    console.log('\n6. Thực hiện truy vấn chính');
    console.log('Query:', query);
    console.log('Params:', JSON.stringify(params, null, 2));

    // Thực hiện truy vấn chính
    console.log('\n7. Thực thi truy vấn...');
    const result = await client.query(query, params);
    console.log(`✅ Truy vấn thành công, tìm thấy ${result.rows.length} bản ghi`);
    
    // Log mẫu dữ liệu (tối đa 2 bản ghi)
    console.log('\n8. Dữ liệu mẫu:');
    result.rows.slice(0, 2).forEach((row, index) => {
      console.log(`Mẫu ${index + 1}:`, {
        id: row.id,
        service_name: row.service_name,
        status: row.status,
        created_at: row.created_at,
        customer_name: row.customer_name
      });
    });

    console.log('\n9. Trả về kết quả');
    const responseData = {
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    console.log('\n=== KẾT THÚC XỬ LÝ THÀNH CÔNG ===\n');
    res.json(responseData);
  } catch (error) {
    console.error('\n=== LỖI XẢY RA ===');
    console.error('Tên lỗi:', error.name);
    console.error('Thông báo lỗi:', error.message);
    
    // Log thêm thông tin về lỗi PostgreSQL nếu có
    if (error.code) {
      console.error('Mã lỗi PostgreSQL:', error.code);
      console.error('Chi tiết lỗi:', error.detail);
      console.error('Vị trí lỗi:', error.position);
      console.error('Query gây lỗi:', error.query);
      console.error('Tham số truy vấn:', error.parameters);
    }
    
    console.error('Stack trace:', error.stack);
    console.error('=== KẾT THÚC THÔNG BÁO LỖI ===\n');
    
    // Trả về lỗi chi tiết hơn cho client
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail
      }
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi lấy danh sách yêu cầu dịch vụ: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Cập nhật trạng thái yêu cầu dịch vụ
exports.updateRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { status, admin_notes } = req.body;

  if (!requestId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu thông tin bắt buộc'
    });
  }

  const validStatuses = ['pending', 'pending_employee_confirmation', 'in_progress', 'completed', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Trạng thái không hợp lệ'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kiểm tra xem yêu cầu có tồn tại không
    const checkRequest = await client.query(
      'SELECT * FROM custom_service_requests WHERE id = $1',
      [requestId]
    );

    if (checkRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu dịch vụ'
      });
    }

    // Cập nhật trạng thái
    const updateQuery = `
      UPDATE custom_service_requests 
      SET 
        status = $1,
        admin_notes = COALESCE($2, admin_notes),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await client.query(updateQuery, [status, admin_notes, requestId]);
    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Cập nhật trạng thái thành công'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi cập nhật trạng thái yêu cầu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái yêu cầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Phân công 1 nhân viên cho yêu cầu dịch vụ (API đơn lẻ, vẫn cập nhật bảng trung gian)
exports.assignEmployee = async (req, res) => {
  const { requestId } = req.params;
  const { employeeId, employee_id } = req.body;
  const targetEmployeeId = employeeId || employee_id;

  if (!requestId || !targetEmployeeId) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu thông tin bắt buộc'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra yêu cầu tồn tại
    const checkRequest = await client.query(
      'SELECT * FROM custom_service_requests WHERE id = $1',
      [requestId]
    );

    if (checkRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu dịch vụ'
      });
    }

    // 2. Kiểm tra nhân viên tồn tại
    const checkEmployee = await client.query(
      'SELECT employee_id, full_name FROM employees WHERE employee_id = $1',
      [targetEmployeeId]
    );

    if (checkEmployee.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Nhân viên không tồn tại hoặc không có quyền'
      });
    }

    const employee = checkEmployee.rows[0];

    // 3. Cập nhật thông tin phân công chính trên bảng custom_service_requests
    const updateQuery = `
      UPDATE custom_service_requests 
      SET 
        assigned_employee_id = $1,
        status = 'pending_employee_confirmation',
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await client.query(updateQuery, [targetEmployeeId, requestId]);
    const updatedRequest = result.rows[0];

    // 4. Đảm bảo có bản ghi trong bảng trung gian cho nhân viên này
    await client.query(
      `INSERT INTO custom_service_request_employees (request_id, employee_id, status)
       SELECT $1, $2, 'pending_employee_confirmation'
       WHERE NOT EXISTS (
         SELECT 1 FROM custom_service_request_employees
         WHERE request_id = $1 AND employee_id = $2
       )`,
      [requestId, targetEmployeeId]
    );

    // 5. Thông báo
    const customerResult = await client.query(
      'SELECT full_name FROM users WHERE id = $1',
      [updatedRequest.user_id]
    );
    const customerName = customerResult.rows[0]?.full_name || 'khách hàng';

    await notificationController.createNotification({
      receiver_type: 'user',
      receiver_id: updatedRequest.user_id,
      user_id: updatedRequest.user_id,
      title: 'Yêu cầu dịch vụ đang chờ nhân viên xác nhận',
      message: `Yêu cầu "${updatedRequest.service_name}" đã được phân công cho ${employee.full_name} và đang chờ nhân viên xác nhận.`,
      type: 'info'
    }, client);

    await notificationController.createNotification({
      receiver_type: 'employee',
      receiver_id: targetEmployeeId,
      title: 'Yêu cầu dịch vụ mới cần xác nhận',
      message: `Bạn được phân công xử lý yêu cầu "${updatedRequest.service_name}" từ khách hàng ${customerName}. Vui lòng xác nhận hoặc từ chối trong hệ thống.`,
      type: 'info'
    }, client);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Phân công nhân viên thành công, chờ nhân viên xác nhận'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi phân công nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân công nhân viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Cập nhật thông tin chi tiết yêu cầu dịch vụ (hỗ trợ nhiều nhân viên)
exports.updateRequest = async (req, res) => {
  const { requestId } = req.params;
  const { employee_ids, assigned_employee_id, status, admin_notes } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Kiểm tra yêu cầu tồn tại
    const existingRequest = await client.query(
      'SELECT id FROM custom_service_requests WHERE id = $1',
      [requestId]
    );

    if (existingRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu dịch vụ với ID đã cung cấp.'
      });
    }

    // Chuẩn hoá danh sách employee_ids
    const employeeIds = Array.isArray(employee_ids) ? employee_ids.filter(id => id != null) : [];

    // Nếu có danh sách nhân viên thì kiểm tra tất cả đều tồn tại
    if (employeeIds.length > 0) {
      const employeeCheck = await client.query(
        'SELECT employee_id FROM employees WHERE employee_id = ANY($1::int[])',
        [employeeIds]
      );

      if (employeeCheck.rows.length !== employeeIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Một hoặc nhiều nhân viên được chọn không tồn tại.'
        });
      }
    }

    const setClauses = [];
    const params = [];

    // Nếu client truyền status thì dùng status đó.
    // Nếu KHÔNG truyền status nhưng có danh sách nhân viên, tự động đặt về 'pending_employee_confirmation'
    if (status !== undefined) {
      params.push(status);
      setClauses.push(`status = $${params.length}`);
    } else if (employeeIds.length > 0) {
      params.push('pending_employee_confirmation');
      setClauses.push(`status = $${params.length}`);
    }

    if (admin_notes !== undefined) {
      params.push(admin_notes);
      setClauses.push(`admin_notes = COALESCE($${params.length}, admin_notes)`);
    }

    // Nếu có mảng nhân viên, chọn nhân viên đầu làm nhân viên chính (assigned_employee_id)
    let primaryEmployeeId = assigned_employee_id;
    if (employeeIds.length > 0) {
      primaryEmployeeId = employeeIds[0];
    }

    if (primaryEmployeeId !== undefined && primaryEmployeeId !== null) {
      params.push(primaryEmployeeId);
      setClauses.push(`assigned_employee_id = $${params.length}`);
    }

    if (setClauses.length === 0 && employeeIds.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu nào để cập nhật.'
      });
    }

    // Thêm updated_at
    setClauses.push('updated_at = NOW()');

    // Nếu có field để cập nhật trên bảng chính thì thực hiện UPDATE
    let updatedRequestRow = null;
    if (setClauses.length > 0) {
      const updateQuery = `
        UPDATE custom_service_requests
        SET ${setClauses.join(', ')}
        WHERE id = $${params.length + 1}
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [...params, requestId]);
      updatedRequestRow = updateResult.rows[0];
    } else {
      // Nếu chỉ thay đổi danh sách nhân viên thì lấy lại bản ghi hiện tại
      const current = await client.query(
        'SELECT * FROM custom_service_requests WHERE id = $1',
        [requestId]
      );
      updatedRequestRow = current.rows[0];
    }

    // Cập nhật bảng trung gian custom_service_request_employees nếu có danh sách nhân viên
    if (employeeIds.length > 0) {
      // Xoá các phân công cũ
      await client.query(
        'DELETE FROM custom_service_request_employees WHERE request_id = $1',
        [requestId]
      );

      // Chèn lại các nhân viên mới
      for (const empId of employeeIds) {
        await client.query(
          `INSERT INTO custom_service_request_employees (request_id, employee_id, status)
           VALUES ($1, $2, $3)`,
          [requestId, empId, 'pending_employee_confirmation']
        );

        // Gửi thông báo cho từng nhân viên được phân công
        try {
          await notificationController.createNotification({
            receiver_type: 'employee',
            receiver_id: empId,
            title: 'Bạn có một công việc mới được phân công',
            message: `Bạn được phân công xử lý yêu cầu "${updatedRequestRow?.service_name || 'Dịch vụ đặc thù'}". Vui lòng vào hệ thống để xác nhận hoặc từ chối.`,
            type: 'info'
          }, client);
        } catch (notifyError) {
          console.error('Lỗi khi gửi thông báo phân công cho nhân viên:', notifyError);
        }
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updatedRequestRow,
      message: 'Cập nhật yêu cầu dịch vụ thành công.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi cập nhật yêu cầu dịch vụ:', error);

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật yêu cầu dịch vụ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// Lấy chi tiết yêu cầu dịch vụ
exports.getRequestDetails = async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu ID yêu cầu'
    });
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        csr.*,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        u.address as customer_address,
        e.full_name as employee_name,
        e.phone as employee_phone,
        e.email as employee_email
      FROM custom_service_requests csr
      LEFT JOIN users u ON csr.user_id = u.id
      LEFT JOIN users e ON csr.assigned_employee_id = e.id
      WHERE csr.id = $1
    `;

    const result = await client.query(query, [requestId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu dịch vụ'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết yêu cầu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin yêu cầu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};
