const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken } = require('../middleware/auth');

// Thêm route mới này lên đầu danh sách các route
router.get('/by-specialization/:specialization', 
  authenticateToken,
  employeeController.getEmployeesBySpecialization
);

// Lấy danh sách yêu cầu dịch vụ được phân công
router.get('/requests', authenticateToken, employeeController.getAssignedAppointments);

// Lấy lịch làm việc (các appointments đã được gán cho nhân viên)
router.get('/appointments', authenticateToken, employeeController.getEmployeeAppointments);

// Nhân viên chấp nhận / từ chối yêu cầu
router.put('/requests/:id/accept', authenticateToken, employeeController.acceptAssignedRequest);
router.put('/requests/:id/reject', authenticateToken, employeeController.rejectAssignedRequest);

// Quản lý thông báo
router.get('/notifications', authenticateToken, employeeController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, employeeController.markNotificationAsRead);

module.exports = router;
