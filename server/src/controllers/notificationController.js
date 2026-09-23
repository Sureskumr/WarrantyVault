import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as notificationService from '../services/notificationService.js';

export const listMine = catchAsync(async (req, res) => {
  const result = await notificationService.listNotificationsForUser({ storeId: req.user.storeId, userId: req.user.id, ...req.query });
  return sendSuccess(res, {
    message: 'Notifications',
    data: { notifications: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const markRead = catchAsync(async (req, res) => {
  await notificationService.markNotificationRead({ storeId: req.user.storeId, notificationId: req.params.id });
  return sendSuccess(res, { message: 'Marked as read' });
});
