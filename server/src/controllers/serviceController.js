import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as serviceRequestService from '../services/serviceRequestService.js';
import { AppError } from '../utils/AppError.js';
import { ROLES } from '../constants/enums.js';

export const createServiceRequest = catchAsync(async (req, res) => {
  // Staff (CASHIER/MANAGER/OWNER) raising a request on behalf of a walk-in customer
  // must supply customerId explicitly.
  if (!req.body.customerId) throw AppError.badRequest('customerId is required');
  const request = await serviceRequestService.createServiceRequest({
    storeId: req.user.storeId,
    performedBy: req.user.id,
    ...req.body,
  });
  return sendSuccess(res, { statusCode: 201, message: 'Service request created', data: { request } });
});

export const listServiceRequests = catchAsync(async (req, res) => {
  const result = await serviceRequestService.listServiceRequests({
    storeId: req.user.storeId,
    role: req.user.role,
    userId: req.user.id,
    ...req.query,
  });
  return sendSuccess(res, {
    message: 'Service requests',
    data: { requests: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const getServiceRequest = catchAsync(async (req, res) => {
  const result = await serviceRequestService.getServiceRequestById({ storeId: req.user.storeId, requestId: req.params.id });
  return sendSuccess(res, { message: 'Service request details', data: result });
});

export const verifyServiceRequest = catchAsync(async (req, res) => {
  const request = await serviceRequestService.verifyServiceRequest({
    storeId: req.user.storeId,
    requestId: req.params.id,
    actingUser: req.user,
    ...req.body,
  });
  return sendSuccess(res, { message: 'Service request verification recorded', data: { request } });
});

export const assignTechnician = catchAsync(async (req, res) => {
  const request = await serviceRequestService.assignTechnician({
    storeId: req.user.storeId,
    requestId: req.params.id,
    actingUser: req.user,
    ...req.body,
  });
  return sendSuccess(res, { message: 'Technician assigned', data: { request } });
});

export const updateStatus = catchAsync(async (req, res) => {
  const { nextStatus, ...updates } = req.body;
  const request = await serviceRequestService.updateServiceStatus({
    storeId: req.user.storeId,
    requestId: req.params.id,
    technicianId: req.user.role === ROLES.TECHNICIAN ? req.user.id : req.body.technicianId,
    nextStatus,
    updates,
  });
  return sendSuccess(res, { message: 'Service request updated', data: { request } });
});

export const getProductHistory = catchAsync(async (req, res) => {
  const history = await serviceRequestService.getProductServiceHistory({ storeId: req.user.storeId, productId: req.params.productId });
  return sendSuccess(res, { message: 'Product service history', data: { history } });
});
