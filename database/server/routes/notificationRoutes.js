const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Lấy danh sách thông báo của người dùng
router.get('/', authenticateToken, notificationController.getUserNotifications);

// Đánh dấu thông báo đã đọc
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

module.exports = router;
