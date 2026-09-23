import { api } from './axiosClient.js';

export const invoiceApi = {
  list: (params) => api.get('/invoices', { params }).then((r) => r.data),
  get: (id) => api.get(`/invoices/${id}`).then((r) => r.data),
  create: (payload) => api.post('/invoices', payload).then((r) => r.data),
  pdfUrl: (id) => `${api.defaults.baseURL}/invoices/${id}/pdf`,
};

export const warrantyApi = {
  list: (params) => api.get('/warranties', { params }).then((r) => r.data),
  get: (id) => api.get(`/warranties/${id}`).then((r) => r.data),
  setStatus: (id, payload) => api.patch(`/warranties/${id}/status`, payload).then((r) => r.data),
};

export const warrantyClaimApi = {
  list: (params) => api.get('/warranty-claims', { params }).then((r) => r.data),
  get: (id) => api.get(`/warranty-claims/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/warranty-claims/${id}`, payload).then((r) => r.data),
};

export const serviceApi = {
  list: (params) => api.get('/services', { params }).then((r) => r.data),
  get: (id) => api.get(`/services/${id}`).then((r) => r.data),
  create: (payload) => api.post('/services', payload).then((r) => r.data),
  verify: (id, payload) => api.patch(`/services/${id}/verify`, payload).then((r) => r.data),
  assign: (id, payload) => api.patch(`/services/${id}/assign`, payload).then((r) => r.data),
  updateStatus: (id, payload) => api.patch(`/services/${id}/status`, payload).then((r) => r.data),
  productHistory: (productId) => api.get(`/services/product/${productId}/history`).then((r) => r.data),
};

export const technicianApi = {
  list: () => api.get('/technicians').then((r) => r.data),
  myDashboard: () => api.get('/technicians/me/dashboard').then((r) => r.data),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard').then((r) => r.data),
  salesTrend: (days) => api.get('/analytics/sales-trend', { params: { days } }).then((r) => r.data),
  topProducts: (limit) => api.get('/analytics/top-products', { params: { limit } }).then((r) => r.data),
  productFailure: () => api.get('/analytics/product-failure').then((r) => r.data),
  claimsTrend: (days) => api.get('/analytics/claims-trend', { params: { days } }).then((r) => r.data),
};

export const auditLogApi = {
  list: (params) => api.get('/audit-logs', { params }).then((r) => r.data),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
};

export const verificationApi = {
  byToken: (token) => api.get(`/verification/invoice/${token}`).then((r) => r.data),
  lookup: (payload) => api.post('/verification/lookup', payload).then((r) => r.data),
  sendOtp: (payload) => api.post('/verification/send-otp', payload).then((r) => r.data),
  verifyOtp: (payload) => api.post('/verification/verify-otp', payload).then((r) => r.data),
};

export const portalApi = {
  profile: () => api.get('/portal/profile').then((r) => r.data),
  invoices: (params) => api.get('/portal/invoices', { params }).then((r) => r.data),
  invoice: (id) => api.get(`/portal/invoices/${id}`).then((r) => r.data),
  invoicePdfUrl: (id) => `${api.defaults.baseURL}/portal/invoices/${id}/pdf`,
  warranties: (params) => api.get('/portal/warranties', { params }).then((r) => r.data),
  createServiceRequest: (payload) => api.post('/portal/service-requests', payload).then((r) => r.data),
  serviceRequests: (params) => api.get('/portal/service-requests', { params }).then((r) => r.data),
  notifications: (params) => api.get('/portal/notifications', { params }).then((r) => r.data),
};
