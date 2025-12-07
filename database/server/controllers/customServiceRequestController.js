const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Tạo yêu cầu dịch vụ đặc thù mới
exports.createCustomServiceRequest = async (req, res) => {
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const client = await pool.connect();
  try {
    const { service_name, description, special_requirements, service_type, pet_id, start_date } = req.body;
    const user_id = req.user.id; // Lấy ID người dùng từ token

    console.log('Service type from request:', service_type);
    console.log('Pet ID from request:', pet_id);
    
    if (!service_type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn loại dịch vụ'
      });
    }

    // Bắt đầu transaction
    await client.query('BEGIN');

    // Thêm yêu cầu mới vào database
    // Tạo câu lệnh SQL cố định với tất cả các trường (bao gồm cả start_date nếu có)
    const queryText = `
      INSERT INTO custom_service_requests (
        user_id,
        service_name,
        description,
        special_requirements,
        status,
        created_at,
        updated_at,
        service_type,
        pet_id,
        start_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const queryParams = [
      user_id,
      service_name || 'Dịch vụ chưa đặt tên',
      description || '',
      special_requirements || 'Không có yêu cầu đặc biệt',
      'pending', // status
      new Date(), // created_at
      new Date(), // updated_at
      service_type || 'Dịch vụ đặc biệt',
      pet_id || null,
      start_date || null
    ];
    
    console.log('Executing query:', queryText);
    console.log('With parameters:', queryParams);
    
    console.log('Executing query:', queryText);
    console.log('With parameters:', queryParams);
    
    const result = await client.query(queryText, queryParams);

    // Commit transaction
    await client.query('COMMIT');

    // Trả về kết quả
    return res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu dịch vụ đặc thù thành công',
      data: result.rows[0]
    });
  } catch (error) {
    // Rollback transaction nếu có lỗi
    if (client) {
      await client.query('ROLLBACK');
    }
    
    console.error('Lỗi khi tạo yêu cầu dịch vụ đặc thù:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý yêu cầu',
      error: error.message
    });
  } finally {
    // Giải phóng client trở lại pool
    if (client) {
      client.release();
    }
  }
};

// Lấy danh sách yêu cầu dịch vụ đặc thù (admin)
exports.getCustomServiceRequests = async (req, res) => {
  try {
    const requests = await CustomServiceRequest.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách yêu cầu:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách yêu cầu',
      error: error.message
    });
  }
};

// Lấy chi tiết yêu cầu dịch vụ đặc thù
exports.getCustomServiceRequestById = async (req, res) => {
  try {
    const request = await CustomServiceRequest.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && request.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập yêu cầu này'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết yêu cầu:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin yêu cầu',
      error: error.message
    });
  }
};

// Cập nhật trạng thái yêu cầu (admin)
exports.updateCustomServiceRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const request = await CustomServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    request.status = status;
    if (status === 'completed') {
      request.completedAt = Date.now();
    }
    
    await request.save();

    res.json({
      success: true,
      message: 'Đã cập nhật trạng thái yêu cầu',
      data: request
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái yêu cầu:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật trạng thái yêu cầu',
      error: error.message
    });
  }
};

// Hủy yêu cầu (người dùng)
exports.cancelCustomServiceRequest = async (req, res) => {
  try {
    const request = await CustomServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    // Kiểm tra quyền truy cập
    if (request.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy yêu cầu này'
      });
    }

    // Chỉ cho phép hủy nếu đang ở trạng thái pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy yêu cầu đang chờ xử lý'
      });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({
      success: true,
      message: 'Đã hủy yêu cầu thành công',
      data: request
    });
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi hủy yêu cầu',
      error: error.message
    });
  }
};

// Lấy danh sách yêu cầu của người dùng hiện tại
exports.getMyCustomServiceRequests = async (req, res) => {
  try {
    const requests = await CustomServiceRequest.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách yêu cầu của người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách yêu cầu',
      error: error.message
    });
  }
};

// Cập nhật yêu cầu
exports.updateCustomServiceRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { service_name, description, special_requirements, service_type } = req.body;
    
    // Kiểm tra service_type nếu có
    if (service_type) {
      const validServiceTypes = ['Khám bệnh', 'Cắt tỉa', 'Spa', 'Tiêm phòng', 'Phẫu thuật'];
      if (!validServiceTypes.includes(service_type)) {
        return res.status(400).json({
          success: false,
          message: 'Loại dịch vụ không hợp lệ',
          validServiceTypes: validServiceTypes
        });
      }
    }

    // Bắt đầu transaction
    await client.query('BEGIN');

    // Lấy thông tin yêu cầu hiện tại
    const requestResult = await client.query(
      'SELECT * FROM custom_service_requests WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [req.params.id, req.user.id]
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoặc bạn không có quyền truy cập'
      });
    }

    const request = requestResult.rows[0];

    // Chỉ cho phép cập nhật nếu đang ở trạng thái pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật yêu cầu đang chờ xử lý'
      });
    }

    // Tạo câu lệnh SQL động dựa trên các trường cần cập nhật
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (service_name) {
      updates.push(`service_name = $${paramCount++}`);
      values.push(service_name);
    }
    if (description) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (special_requirements !== undefined) {
      updates.push(`special_requirements = $${paramCount++}`);
      values.push(special_requirements);
    }
    if (service_type) {
      updates.push(`service_type = $${paramCount++}`);
      values.push(service_type);
    }

    // Nếu không có trường nào được cập nhật
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu nào để cập nhật'
      });
    }

    // Thêm updated_at vào danh sách cập nhật
    updates.push(`updated_at = NOW()`);
    
    // Thêm ID vào mảng giá trị cho điều kiện WHERE
    values.push(req.params.id);
    values.push(req.user.id);

    // Thực hiện cập nhật
    const query = `
      UPDATE custom_service_requests 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await client.query(query, values);
    
    // Commit transaction
    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Cập nhật yêu cầu thành công',
      data: result.rows[0]
    });
  } catch (error) {
    // Rollback transaction nếu có lỗi
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Lỗi khi cập nhật yêu cầu:', error);
return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật yêu cầu',
      error: error.message
    });
  } finally {
    // Giải phóng client trở lại pool
    if (client) {
      client.release();
    }
  }
};
