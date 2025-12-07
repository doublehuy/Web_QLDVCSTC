const { body, validationResult } = require('express-validator');

// Middleware xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

// Validation cho đăng ký user
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('full_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Họ tên phải có ít nhất 2 ký tự'),
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  handleValidationErrors
];

// Validation cho đăng nhập
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
  handleValidationErrors
];

// Validation cho thông tin thú cưng
const validatePet = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Tên thú cưng không được để trống'),
  body('species')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Loài thú cưng không được để trống'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Tuổi phải là số từ 0 đến 30'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('Giới tính phải là male, female hoặc unknown'),
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Cân nặng phải là số từ 0 đến 100 kg'),
  handleValidationErrors
];

// Validation cho lịch hẹn
const validateAppointment = [
  body('pet_id')
    .isInt({ min: 1 })
    .withMessage('ID thú cưng không hợp lệ'),
  body('service_id')
    .isInt({ min: 1 })
    .withMessage('ID dịch vụ không hợp lệ'),
  body('appointment_date')
    .isISO8601()
    .withMessage('Ngày hẹn không hợp lệ')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Ngày hẹn không được là ngày trong quá khứ');
      }
      return true;
    }),
  body('appointment_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Giờ hẹn không hợp lệ (HH:MM)'),
  handleValidationErrors
];

// Validation cho dịch vụ
const validateService = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Tên dịch vụ không được để trống'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Giá dịch vụ phải là số dương'),
  body('duration_minutes')
    .isInt({ min: 1 })
    .withMessage('Thời gian dịch vụ phải là số nguyên dương'),
  body('category')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Danh mục dịch vụ không được để trống'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validatePet,
  validateAppointment,
  validateService
};
