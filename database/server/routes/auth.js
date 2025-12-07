const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Đăng nhập
router.post('/login', authController.login);

// Đăng ký (chỉ dành cho admin tạo tài khoản mới)
router.post('/register', authController.register);

// Lấy thông tin profile
router.get('/profile', authenticateToken, authController.getProfile);

// Cập nhật thông tin profile
router.put('/profile', authenticateToken, authController.updateProfile);

// Đổi mật khẩu
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
