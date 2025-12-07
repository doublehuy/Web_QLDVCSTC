const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware xác thực JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token truy cập không được cung cấp' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra user còn tồn tại và active không
    const result = await pool.query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Người dùng không tồn tại' 
      });
    }

    if (!result.rows[0].is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tài khoản đã bị vô hiệu hóa' 
      });
    }

    const userData = result.rows[0];

    if (userData.role === 'employee' || userData.role === 'staff') {
      try {
        const employeeResult = await pool.query(
          'SELECT employee_id, status FROM employees WHERE user_id = $1',
          [userData.id]
        );

        if (employeeResult.rows.length > 0) {
          userData.employee_id = employeeResult.rows[0].employee_id;
          userData.employee_status = employeeResult.rows[0].status;
        }
      } catch (employeeError) {
        console.error('Lỗi khi lấy thông tin nhân viên:', employeeError);
        return res.status(500).json({
          success: false,
          message: 'Không thể xác định thông tin nhân viên'
        });
      }
    }

    req.user = userData;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token không hợp lệ' 
    });
  }
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bạn không có quyền truy cập chức năng này' 
    });
  }
  next();
};

// Middleware kiểm tra quyền admin chỉ dành cho admin
const requireAdminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Chỉ quản trị viên mới có quyền truy cập chức năng này' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOnly
};
