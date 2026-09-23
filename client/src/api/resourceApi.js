import { api } from './axiosClient.js';

export const storeApi = {
  getMine: () => api.get('/stores/me').then((r) => r.data),
  updateMine: (payload) => api.put('/stores/me', payload).then((r) => r.data),
};

export const customerApi = {
  list: (params) => api.get('/customers', { params }).then((r) => r.data),
  get: (id) => api.get(`/customers/${id}`).then((r) => r.data),
  create: (payload) => api.post('/customers', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/customers/${id}`, payload).then((r) => r.data),
};

export const productApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (payload) => api.post('/products', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const staffApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`).then((r) => r.data),
  updateRole: (id, payload) => api.patch(`/users/${id}/role`, payload).then((r) => r.data),
};
