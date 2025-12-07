const express = require('express');
const router = express.Router();
const employeesController = require('../controllers/employeesController');
const { authenticateToken } = require('../middleware/auth');

// Middleware kiểm tra quyền admin (có thể tạo sau)
const requireAdmin = (req, res, next) => {
  // Tạm thời cho phép tất cả authenticated users
  // Sau này có thể thêm kiểm tra role
  next();
};

// Lấy danh sách nhân viên theo chuyên môn
router.get('/', authenticateToken, employeesController.getEmployeesBySpecialization);

// Lấy tất cả nhân viên
router.get('/all', authenticateToken, requireAdmin, employeesController.getAllEmployees);

// Lấy thông tin nhân viên theo ID
router.get('/:id', authenticateToken, employeesController.getEmployeeById);

// Tạo nhân viên mới
router.post('/', authenticateToken, requireAdmin, employeesController.createEmployee);

// Cập nhật thông tin nhân viên
router.put('/:id', authenticateToken, requireAdmin, employeesController.updateEmployee);

// Xóa nhân viên
router.delete('/:id', authenticateToken, requireAdmin, employeesController.deleteEmployee);

module.exports = router;
