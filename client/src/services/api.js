import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  crossDomain: true
});

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/api/auth/change-password', passwordData),
};

// Pets API
export const petsAPI = {
  getPets: (params) => api.get('/api/pets', { params }),
  getPetById: (id) => api.get(`/api/pets/${id}`),
  // Nếu petData là FormData (có file ảnh), axios sẽ tự set boundary khi mình override Content-Type
  createPet: (petData) => api.post('/api/pets', petData, {
    headers: {
      'Content-Type': petData instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  }),
  updatePet: (id, petData) => api.put(`/api/pets/${id}`, petData, {
    headers: {
      'Content-Type': petData instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  }),
  deletePet: (id) => api.delete(`/api/pets/${id}`),
  getPetServiceHistory: (id) => api.get(`/api/pets/${id}/service-history`),
};

// Appointments API
export const appointmentsAPI = {
  getAppointments: (params) => api.get('/api/appointments', { params }),
  getAppointmentById: (id) => api.get(`/api/appointments/${id}`),
  createAppointment: (appointmentData) => api.post('/api/appointments', appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/api/appointments/${id}`, appointmentData),
  cancelAppointment: (id, reason) => api.put(`/api/appointments/${id}/cancel`, { reason }),
  getAvailableSlots: (date) => api.get('/api/appointments/available-slots', { params: { date } }),
};

// Services API for public use (user pages)
export const servicesAPI = {
  getServices: (params) => api.get('/api/services/public', { params }),
  getServiceById: (id) => api.get(`/api/services/public/${id}`),
  getServiceCategories: () => api.get('/api/services/public/categories'),
};

// Admin Services API (admin pages)
export const adminServicesAPI = {
  getServices: (params) => api.get('/api/services', { params }),
  getServiceById: (id) => api.get(`/api/services/${id}`),
  getServiceCategories: () => api.get('/api/services/categories'),
  createService: (serviceData) => api.post('/api/services', serviceData),
  updateService: (id, serviceData) => api.put(`/api/services/${id}`, serviceData),
  deleteService: (id) => api.delete(`/api/services/${id}`),
  getServiceStatistics: (params) => api.get('/api/services/statistics/usage', { params }),
};

// Admin API
// Custom Service Requests API
export const customServiceAPI = {
  // Tạo yêu cầu dịch vụ đặc thù mới
  createCustomServiceRequest: (requestData) => 
    api.post('/api/custom-service-requests', requestData),
  
  // Lấy danh sách yêu cầu dịch vụ đặc thù
  getCustomServiceRequests: (params) => 
    api.get('/api/custom-service-requests', { params }),
  
  // Lấy chi tiết yêu cầu dịch vụ đặc thù theo ID
  getCustomServiceRequestById: (id) => 
    api.get(`/api/custom-service-requests/${id}`),
  
  // Cập nhật trạng thái yêu cầu
  updateCustomServiceRequestStatus: (id, statusData) => 
    api.put(`/api/custom-service-requests/${id}/status`, statusData),
  
  // Hủy yêu cầu dịch vụ đặc thù
  cancelCustomServiceRequest: (id) =>
    api.delete(`/api/custom-service-requests/${id}`),
    
  // Lấy danh sách yêu cầu của người dùng hiện tại
  getMyCustomServiceRequests: () =>
    api.get('/api/users/me/custom-service-requests'),
    
  // Cập nhật yêu cầu dịch vụ đặc thù
  updateCustomServiceRequest: (id, requestData) =>
    api.put(`/api/custom-service-requests/${id}`, requestData)
};

export const adminAPI = {
  // Appointments
  getAppointments: (params) => api.get('/api/admin/appointments', { params }),
  getAllAppointments: (params) => api.get('/api/admin/appointments', { params }),
  updateAppointmentStatus: (id, statusData) => api.put(`/api/admin/appointments/${id}/status`, statusData),
  assignEmployee: (id, employeeData) => api.put(`/api/admin/appointments/${id}/assign`, employeeData),
  
  // Service Requests
  getServiceRequests: (params) => api.get('/api/admin/custom-service-requests', { params }),
  updateServiceRequestStatus: (id, statusData) => api.put(`/api/admin/custom-service-requests/${id}/status`, statusData),
  updateServiceRequest: (id, requestData) => api.put(`/api/admin/custom-service-requests/${id}`, requestData),
  
  // Customers
  getAllCustomers: (params) => api.get('/api/admin/customers', { params }),
  deleteCustomer: (id) => api.delete(`/api/admin/customers/${id}`),
  
  // Invoices
  getAllInvoices: (params) => api.get('/api/admin/invoices', { params }),
  updateInvoicePaymentStatus: (id, statusData) => api.put(`/api/admin/invoices/${id}/status`, statusData),
  
  // Dashboard
  getDashboardStats: (params) => api.get('/api/admin/dashboard/stats', { params }),
};

// Notifications API
export const notificationsAPI = {
  // Lấy danh sách thông báo của user hiện tại
  getMyNotifications: () => api.get('/api/notifications'),

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
};

// Employees API
export const employeesAPI = {
  getEmployees: (params) => api.get('/api/employees', { params }),
  getEmployeesBySpecialization: (specialization) => api.get('/api/employees', { params: { specialization } }),
  getAllEmployees: () => api.get('/api/employees/all'),
  getEmployeeById: (id) => api.get(`/api/employees/${id}`),
  createEmployee: (employeeData) => api.post('/api/employees', employeeData),
  updateEmployee: (id, employeeData) => api.put(`/api/employees/${id}`, employeeData),
  deleteEmployee: (id) => api.delete(`/api/employees/${id}`),
  getEmployeesBySpecialization: (specialization) => {
    return api.get(`/api/employees/by-specialization/${encodeURIComponent(specialization)}`);
  }
};

export default api;
