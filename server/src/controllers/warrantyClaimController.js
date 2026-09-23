import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as warrantyClaimService from '../services/warrantyClaimService.js';

export const listClaims = catchAsync(async (req, res) => {
  const result = await warrantyClaimService.listClaims({ storeId: req.user.storeId, ...req.query });
  return sendSuccess(res, {
    message: 'Warranty claims',
    data: { claims: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const getClaim = catchAsync(async (req, res) => {
  const claim = await warrantyClaimService.getClaimById({ storeId: req.user.storeId, claimId: req.params.id });
  return sendSuccess(res, { message: 'Claim details', data: { claim } });
});

export const updateClaim = catchAsync(async (req, res) => {
  const claim = await warrantyClaimService.updateClaimStatus({ storeId: req.user.storeId, claimId: req.params.id, actingUser: req.user, ...req.body });
  return sendSuccess(res, { message: 'Claim updated', data: { claim } });
});
