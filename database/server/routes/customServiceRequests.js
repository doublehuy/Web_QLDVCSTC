const express = require('express');
const router = express.Router();
const customServiceRequestController = require('../controllers/customServiceRequestController');
const { authenticateToken } = require('../middleware/auth');

// Tất cả routes đều cần xác thực
router.use(authenticateToken);

// Tạo yêu cầu dịch vụ đặc thù mới
router.post('/', customServiceRequestController.createCustomServiceRequest);

// Lấy danh sách yêu cầu dịch vụ đặc thù (admin)
router.get('/', customServiceRequestController.getCustomServiceRequests);

// Lấy chi tiết yêu cầu dịch vụ đặc thù
router.get('/:id', customServiceRequestController.getCustomServiceRequestById);

// Cập nhật trạng thái yêu cầu (admin)
router.put('/:id/status', customServiceRequestController.updateCustomServiceRequestStatus);

// Hủy yêu cầu (người dùng)
router.delete('/:id', customServiceRequestController.cancelCustomServiceRequest);

// Lấy danh sách yêu cầu của người dùng hiện tại
router.get('/user/me', customServiceRequestController.getMyCustomServiceRequests);

// Cập nhật yêu cầu
router.put('/:id', customServiceRequestController.updateCustomServiceRequest);

module.exports = router;
