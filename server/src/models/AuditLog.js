import mongoose from 'mongoose';
import { AUDIT_ACTION_VALUES } from '../constants/enums.js';

const { Schema, model } = mongoose;

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    action: { type: String, enum: AUDIT_ACTION_VALUES, required: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    reason: { type: String, trim: true, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false, capped: false }
);

auditLogSchema.index({ storeId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ storeId: 1, timestamp: -1 });

// No update/delete hooks or methods are exposed on purpose — audit entries
// are append-only. Corrections happen by writing a new entry, never editing one.
export const AuditLog = model('AuditLog', auditLogSchema);
