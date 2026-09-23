import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as warrantyService from '../services/warrantyService.js';
import { recordAudit } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../constants/enums.js';

export const listWarranties = catchAsync(async (req, res) => {
  const result = await warrantyService.listWarranties({ storeId: req.user.storeId, ...req.query });
  return sendSuccess(res, {
    message: 'Warranties',
    data: { warranties: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const getWarranty = catchAsync(async (req, res) => {
  const warranty = await warrantyService.getWarrantyById({ storeId: req.user.storeId, warrantyId: req.params.id });
  return sendSuccess(res, {
    message: 'Warranty details',
    data: { warranty: { ...warranty.toObject(), status: warranty.computeStatus(), daysRemaining: warranty.daysRemaining() } },
  });
});

// OWNER-only manual override — always audited (rules #4 and #5).
export const setManualStatus = catchAsync(async (req, res) => {
  const before = await warrantyService.getWarrantyById({ storeId: req.user.storeId, warrantyId: req.params.id });
  const oldManualStatus = before.manualStatus;

  const warranty = await warrantyService.setManualStatus({
    storeId: req.user.storeId,
    warrantyId: req.params.id,
    manualStatus: req.body.manualStatus,
  });

  await recordAudit({
    userId: req.user.id,
    storeId: req.user.storeId,
    action: AUDIT_ACTIONS.WARRANTY_MODIFIED,
    entityType: 'Warranty',
    entityId: warranty._id,
    oldValue: { manualStatus: oldManualStatus },
    newValue: { manualStatus: warranty.manualStatus },
    reason: req.body.reason,
    req,
  });

  return sendSuccess(res, { message: 'Warranty status updated', data: { warranty } });
});
