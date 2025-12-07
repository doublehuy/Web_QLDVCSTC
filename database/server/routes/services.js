const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Routes công khai (không cần xác thực) - cho user thường xem dịch vụ
router.get('/public', serviceController.getPublicServices);
router.get('/public/categories', serviceController.getPublicServiceCategories);
router.get('/public/:id', serviceController.getServiceByIdPublic);

// Tất cả routes services đều cần xác thực và quyền admin
router.use(authenticateToken);
router.use(requireAdmin);

// Lấy danh sách dịch vụ (cho admin quản lý)
router.get('/', serviceController.getServices);

// Lấy dịch vụ theo ID
router.get('/:id', serviceController.getServiceById);

// Tạo dịch vụ mới
router.post('/', serviceController.createService);

// Cập nhật dịch vụ
router.put('/:id', serviceController.updateService);

// Xóa dịch vụ
router.delete('/:id', serviceController.deleteService);

// Lấy danh mục dịch vụ
router.get('/categories', serviceController.getServiceCategories);

// Lấy thống kê sử dụng dịch vụ
router.get('/statistics/usage', serviceController.getServiceStatistics);

module.exports = router;
