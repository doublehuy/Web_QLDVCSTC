import api from './api';

export default {
  getAppointments: () => api.get('/appointments'),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  createAppointment: (data) => api.post('/appointments', data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  cancelAppointment: (id) => api.put(`/appointments/${id}/cancel`),
  getAvailableSlots: (serviceId, date) => api.get(`/appointments/available-slots?service_id=${serviceId}&date=${date}`),
  getUpcomingAppointments: () => api.get('/appointments/upcoming'),
  getAppointmentHistory: () => api.get('/appointments/history')
};
