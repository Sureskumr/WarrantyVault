import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';

export const createStaff = catchAsync(async (req, res) => {
  const user = await userService.createStaffUser({ actingUser: req.user, ...req.body, req });
  return sendSuccess(res, { statusCode: 201, message: 'Staff account created', data: { user: user.toSafeJSON() } });
});

export const listStaff = catchAsync(async (req, res) => {
  const result = await userService.listStoreUsers({ storeId: req.user.storeId, ...req.query });
  return sendSuccess(res, {
    message: 'Store users',
    data: { users: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const deactivateStaff = catchAsync(async (req, res) => {
  const user = await userService.deactivateStaffUser({ actingUser: req.user, targetUserId: req.params.id, req });
  return sendSuccess(res, { message: 'User deactivated', data: { user: user.toSafeJSON() } });
});

export const updateStaffRole = catchAsync(async (req, res) => {
  const user = await authService.changeUserRole({
    actingUser: req.user,
    targetUserId: req.params.id,
    newRole: req.body.role,
    reason: req.body.reason,
    req,
  });
  return sendSuccess(res, { message: 'Role updated', data: { user: user.toSafeJSON() } });
});
