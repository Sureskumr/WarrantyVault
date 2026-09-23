import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as customerService from '../services/customerService.js';

export const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer({ actingUser: req.user, data: req.body, req });
  return sendSuccess(res, { statusCode: 201, message: 'Customer created', data: { customer } });
});

export const listCustomers = catchAsync(async (req, res) => {
  const result = await customerService.listCustomers({ storeId: req.user.storeId, ...req.query });
  return sendSuccess(res, {
    message: 'Customers',
    data: { customers: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const getCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById({ storeId: req.user.storeId, customerId: req.params.id });
  return sendSuccess(res, { message: 'Customer details', data: { customer } });
});

export const updateCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomer({
    actingUser: req.user,
    customerId: req.params.id,
    updates: req.body,
    req,
  });
  return sendSuccess(res, { message: 'Customer updated', data: { customer } });
});
