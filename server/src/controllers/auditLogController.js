import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as auditLogQueryService from '../services/auditLogQueryService.js';

export const listAuditLogs = catchAsync(async (req, res) => {
  const result = await auditLogQueryService.listAuditLogs({ storeId: req.user.storeId, ...req.query });
  return sendSuccess(res, {
    message: 'Audit logs',
    data: { logs: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});
