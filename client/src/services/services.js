import api from './api';

export default {
  getAllServices: () => api.get('/services'),
  getService: (id) => api.get(`/services/${id}`),
  createService: (data) => api.post('/services', data),
  updateService: (id, data) => api.put(`/services/${id}`, data),
  deleteService: (id) => api.delete(`/services/${id}`),
  getServiceCategories: () => api.get('/services/categories'),
  getServicesByCategory: (categoryId) => api.get(`/services/category/${categoryId}`)
};
