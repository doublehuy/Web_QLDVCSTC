const express = require('express');
const router = express.Router();
const customServiceRequestController = require('../../controllers/admin/customServiceRequestController');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// Lấy danh sách yêu cầu dịch vụ tùy chỉnh
router.get('/', authenticateToken, requireAdmin, customServiceRequestController.getAllCustomServiceRequests);

// Lấy chi tiết yêu cầu dịch vụ
router.get('/:requestId', authenticateToken, requireAdmin, customServiceRequestController.getRequestDetails);

// Cập nhật trạng thái yêu cầu
router.put('/:requestId/status', authenticateToken, requireAdmin, customServiceRequestController.updateRequestStatus);

// Phân công nhân viên
router.put('/:requestId/assign', authenticateToken, requireAdmin, customServiceRequestController.assignEmployee);

// Cập nhật thông tin chi tiết yêu cầu
router.put('/:requestId', authenticateToken, requireAdmin, customServiceRequestController.updateRequest);

module.exports = router;
