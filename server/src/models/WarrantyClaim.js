import mongoose from 'mongoose';
import { CLAIM_STATUS_VALUES, CLAIM_STATUSES } from '../constants/enums.js';

const { Schema, model } = mongoose;

const warrantyClaimSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    claimId: { type: String, required: true, unique: true },
    warrantyId: { type: Schema.Types.ObjectId, ref: 'Warranty', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },
    issue: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: CLAIM_STATUS_VALUES, default: CLAIM_STATUSES.PENDING },
    diagnosis: { type: String, trim: true, default: '' },
    resolution: { type: String, trim: true, default: '' },
    rejectionReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

warrantyClaimSchema.index({ storeId: 1, warrantyId: 1 });
warrantyClaimSchema.index({ storeId: 1, status: 1 });

export const WarrantyClaim = model('WarrantyClaim', warrantyClaimSchema);
