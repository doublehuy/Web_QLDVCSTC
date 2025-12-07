import api from './api';

export default {
  getPetsByUser: () => api.get('/pets/my-pets'),
  getPet: (id) => api.get(`/pets/${id}`),
  createPet: (data) => api.post('/pets', data),
  updatePet: (id, data) => api.put(`/pets/${id}`, data),
  deletePet: (id) => api.delete(`/pets/${id}`),
  getPetTypes: () => api.get('/pets/types'),
  getPetBreeds: (type) => api.get(`/pets/breeds?type=${type}`)
};
