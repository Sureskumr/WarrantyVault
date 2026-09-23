import mongoose from 'mongoose';
import {
  WARRANTY_START_TYPE_VALUES,
  WARRANTY_START_TYPES,
  DURATION_UNIT_VALUES,
  DURATION_UNITS,
  WARRANTY_STATUS_VALUES,
  WARRANTY_STATUSES,
} from '../constants/enums.js';

const { Schema, model } = mongoose;

const warrantySchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    serialNumber: { type: String, trim: true, default: '' },
    provider: { type: String, trim: true, default: '' },
    startType: { type: String, enum: WARRANTY_START_TYPE_VALUES, default: WARRANTY_START_TYPES.PURCHASE_DATE },
    startDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 0 },
    durationUnit: { type: String, enum: DURATION_UNIT_VALUES, default: DURATION_UNITS.MONTHS },
    endDate: { type: Date, required: true },
    terms: { type: String, trim: true, default: '' },
    coveredComponents: { type: [String], default: [] },
    excludedConditions: { type: [String], default: [] },
    // Manually-settable states that override the date-derived default
    // (SUSPENDED/CANCELLED/CLAIMED). Null means "derive from dates".
    manualStatus: { type: String, enum: WARRANTY_STATUS_VALUES, default: null },
    claimCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

warrantySchema.index({ storeId: 1, serialNumber: 1 });
warrantySchema.index({ storeId: 1, invoiceId: 1 });
warrantySchema.index({ storeId: 1, customerId: 1 });
warrantySchema.index({ storeId: 1, endDate: 1 });

/**
 * Rule #8: warranty status is derived from dates, never trusted as a stored
 * flag that can silently go stale. manualStatus only covers states dates
 * can't express (SUSPENDED/CANCELLED/CLAIMED); expiry always wins over CLAIMED
 * so an expired warranty can never look active again (rule #8b).
 */
warrantySchema.methods.computeStatus = function computeStatus(now = new Date()) {
  if (this.manualStatus === WARRANTY_STATUSES.SUSPENDED || this.manualStatus === WARRANTY_STATUSES.CANCELLED) {
    return this.manualStatus;
  }
  if (now > this.endDate) return WARRANTY_STATUSES.EXPIRED;
  if (this.manualStatus === WARRANTY_STATUSES.CLAIMED) return WARRANTY_STATUSES.CLAIMED;

  const msRemaining = this.endDate.getTime() - now.getTime();
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
  if (daysRemaining <= 30) return WARRANTY_STATUSES.EXPIRING_SOON;
  return WARRANTY_STATUSES.ACTIVE;
};

warrantySchema.methods.daysRemaining = function daysRemaining(now = new Date()) {
  const ms = this.endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

warrantySchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    status: this.computeStatus(),
    startDate: this.startDate,
    endDate: this.endDate,
    daysRemaining: this.daysRemaining(),
    duration: this.duration,
    durationUnit: this.durationUnit,
  };
};

export const Warranty = model('Warranty', warrantySchema);
