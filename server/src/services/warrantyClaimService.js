import { WarrantyClaim } from '../models/WarrantyClaim.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTIONS } from '../constants/enums.js';

export async function listClaims({ storeId, page = 1, limit = 20, status }) {
  const filter = { storeId };
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    WarrantyClaim.find(filter)
      .populate('customerId', 'name phone')
      .populate('productId', 'name brand')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    WarrantyClaim.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getClaimById({ storeId, claimId }) {
  const claim = await WarrantyClaim.findOne({ _id: claimId, storeId }).populate('customerId', 'name phone').populate('productId', 'name brand');
  if (!claim) throw AppError.notFound('Warranty claim not found');
  return claim;
}

export async function updateClaimStatus({ storeId, claimId, status, resolution, rejectionReason, actingUser }) {
  const claim = await WarrantyClaim.findOne({ _id: claimId, storeId });
  if (!claim) throw AppError.notFound('Warranty claim not found');

  const oldStatus = claim.status;
  claim.status = status;
  if (resolution) claim.resolution = resolution;
  if (rejectionReason) claim.rejectionReason = rejectionReason;
  await claim.save();

  await recordAudit({
    userId: actingUser.id,
    storeId,
    action: AUDIT_ACTIONS.WARRANTY_CLAIM_UPDATED,
    entityType: 'WarrantyClaim',
    entityId: claim._id,
    oldValue: { status: oldStatus },
    newValue: { status },
  });

  return claim;
}
