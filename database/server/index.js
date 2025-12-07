const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5001'];

// Enable CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware bảo mật
// Cho phép các origin khác (như frontend React trên port 3000) load resource tĩnh như ảnh
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Tăng giới hạn lên 1000 requests mỗi 15 phút
  message: {
    success: false,
    message: 'Quá nhiều requests, vui lòng thử lại sau 15 phút'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files cho ảnh upload (pets)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Chỉ sử dụng routes admin và auth cần thiết
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/pets', require('./routes/pets'));
const appointmentsRouter = require('./routes/appointments');
app.use('/api/appointments', appointmentsRouter);
app.use('/api/appointments', require('./routes/appointmentAssignmentRoutes')); // Thêm route phân công lịch hẹn
app.use('/api/custom-service-requests', require('./routes/customServiceRequests'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notificationRoutes')); // Thêm route cho thông báo
app.use('/api/admin/custom-service-requests', require('./routes/admin/customServiceRequestRoutes')); // Thêm route cho yêu cầu dịch vụ đặc thù
app.use('/api/employee', require('./routes/employeeRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server đang hoạt động bình thường',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Có lỗi xảy ra trên server' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
