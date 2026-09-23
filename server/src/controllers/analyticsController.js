import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as analyticsService from '../services/analyticsService.js';

export const dashboard = catchAsync(async (req, res) => {
  const data = await analyticsService.getDashboardSummary(req.user.storeId);
  return sendSuccess(res, { message: 'Dashboard analytics', data });
});

export const salesTrend = catchAsync(async (req, res) => {
  const data = await analyticsService.getSalesTrend(req.user.storeId, Number(req.query.days) || 30);
  return sendSuccess(res, { message: 'Sales trend', data: { trend: data } });
});

export const topProducts = catchAsync(async (req, res) => {
  const data = await analyticsService.getTopProducts(req.user.storeId, Number(req.query.limit) || 10);
  return sendSuccess(res, { message: 'Top products', data: { products: data } });
});

export const productFailure = catchAsync(async (req, res) => {
  const data = await analyticsService.getProductFailureAnalytics(req.user.storeId);
  return sendSuccess(res, { message: 'Product failure analytics', data: { products: data } });
});

export const claimsTrend = catchAsync(async (req, res) => {
  const data = await analyticsService.getWarrantyClaimsTrend(req.user.storeId, Number(req.query.days) || 90);
  return sendSuccess(res, { message: 'Warranty claims trend', data: { trend: data } });
});
