import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as storeService from '../services/storeService.js';

export const getMyStore = catchAsync(async (req, res) => {
  const store = await storeService.getStoreById(req.user.storeId);
  return sendSuccess(res, { message: 'Store details', data: { store } });
});

export const updateMyStore = catchAsync(async (req, res) => {
  const store = await storeService.updateStore({ actingUser: req.user, updates: req.body, req });
  return sendSuccess(res, { message: 'Store updated', data: { store } });
});
