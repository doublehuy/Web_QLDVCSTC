const mongoose = require('mongoose');

const customServiceRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service_name: {
    type: String,
    required: [true, 'Vui lòng nhập tên dịch vụ'],
    trim: true,
    maxlength: [100, 'Tên dịch vụ không được vượt quá 100 ký tự']
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả chi tiết'],
    trim: true
  },
  special_requirements: {
    type: String,
    trim: true,
    default: 'Không có yêu cầu đặc biệt'
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'pending'
  },
  admin_notes: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
customServiceRequestSchema.index({ user: 1, status: 1 });
customServiceRequestSchema.index({ status: 1 });

// Pre-save hook to update updatedAt
customServiceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for formatted dates
customServiceRequestSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('vi-VN');
});

// Virtual for status text
customServiceRequestSchema.virtual('statusText').get(function() {
  const statusMap = {
    'pending': 'Chờ xử lý',
    'in_progress': 'Đang xử lý',
    'completed': 'Đã hoàn thành',
    'rejected': 'Từ chối',
    'cancelled': 'Đã hủy'
  };
  return statusMap[this.status] || this.status;
});

// Static method to get status options
customServiceRequestSchema.statics.getStatusOptions = function() {
  return [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'in_progress', label: 'Đang xử lý' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'rejected', label: 'Từ chối' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];
};

const CustomServiceRequest = mongoose.model('CustomServiceRequest', customServiceRequestSchema);

module.exports = CustomServiceRequest;
