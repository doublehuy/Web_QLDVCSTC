const express = require('express');
const router = express.Router();
const { assignEmployee, updateAppointmentStatus } = require('../controllers/appointmentAssignmentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Phân công nhân viên (chỉ admin)
router.put('/:id/assign', authenticateToken, requireAdmin, assignEmployee);

// Cập nhật trạng thái lịch hẹn (admin hoặc nhân viên được phân công)
router.put('/:id/status', authenticateToken, updateAppointmentStatus);

module.exports = router;
