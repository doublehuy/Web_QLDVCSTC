const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const appointmentController = require('../controllers/admin/appointmentController');
const employeeController = require('../controllers/admin/employeeController');
const customServiceRequestController = require('../controllers/admin/customServiceRequestController');
const { authenticateToken, requireAdmin, isAdmin } = require('../middleware/auth');

// Tất cả routes admin đều cần xác thực và quyền admin
router.use(authenticateToken);
router.use(requireAdmin);

// Quản lý lịch hẹn (chỉ dùng lịch hẹn chuẩn từ bảng appointments)
router.get('/appointments', adminController.getAllAppointments);
router.put('/appointments/:id/status', appointmentController.updateAppointmentStatus);
router.put('/appointments/:id/assign', appointmentController.assignEmployee);

// Quản lý nhân viên
router.get('/employees', employeeController.getEmployees);

// Quản lý khách hàng
router.get('/customers', (req, res, next) => {
  console.log('📢 API được gọi: GET /api/admin/customers');
  console.log('📋 Query params:', req.query);
  adminController.getAllCustomers(req, res, next);
});

router.delete('/customers/:id', adminController.deleteCustomer);

// Quản lý hóa đơn
router.get('/invoices', adminController.getAllInvoices);
router.put('/invoices/:id/payment-status', adminController.updateInvoicePaymentStatus);

// Thống kê dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Quản lý yêu cầu dịch vụ đặc thù
router.get('/custom-service-requests', customServiceRequestController.getAllCustomServiceRequests);
router.get('/custom-service-requests/:requestId', customServiceRequestController.getRequestDetails);
router.put('/custom-service-requests/:requestId/status', customServiceRequestController.updateRequestStatus);
router.put('/custom-service-requests/:requestId/assign', customServiceRequestController.assignEmployee);

module.exports = router;
