const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const { authenticateToken } = require('../middleware/auth');

// Lấy danh sách lịch hẹn của user hiện tại
router.get('/', authenticateToken, appointmentsController.getUserAppointments);

// Lấy thông tin lịch hẹn theo ID
router.get('/:id', authenticateToken, appointmentsController.getAppointmentById);

// Tạo lịch hẹn mới
router.post('/', authenticateToken, appointmentsController.createAppointment);

// Cập nhật lịch hẹn
router.put('/:id', authenticateToken, appointmentsController.updateAppointment);

// Hủy lịch hẹn
router.put('/:id/cancel', authenticateToken, appointmentsController.cancelAppointment);

// Lấy lịch trống có sẵn
router.get('/available-slots', authenticateToken, appointmentsController.getAvailableSlots);

// Lấy tất cả lịch hẹn (cho admin)
router.get('/admin/all', authenticateToken, appointmentsController.getAllAppointments);

module.exports = router;
