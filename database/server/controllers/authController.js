const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Đăng ký tài khoản mới
const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, address } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Tạo user mới
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, address, role)
       VALUES ($1, $2, $3, $4, $5, 'customer')
       RETURNING id, email, full_name, phone, address, role, created_at`,
      [email, passwordHash, full_name, phone, address]
    );

    const user = result.rows[0];

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          role: user.role,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký tài khoản'
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, phone, address, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const user = result.rows[0];

    // Kiểm tra tài khoản có bị vô hiệu hóa không
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
};

// Lấy thông tin user hiện tại
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, email, full_name, phone, address, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile'
    });
  }
};

// Cập nhật thông tin profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, address } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, address = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, full_name, phone, address, role, updated_at`,
      [full_name, phone, address, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin'
    });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Lấy mật khẩu hiện tại
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Mã hóa mật khẩu mới
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật mật khẩu
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
