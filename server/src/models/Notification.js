import mongoose from 'mongoose';
import { NOTIFICATION_CHANNEL_VALUES } from '../constants/enums.js';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    // Recipient may be a Customer or a User (staff), so both are optional refs.
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    channel: { type: String, enum: NOTIFICATION_CHANNEL_VALUES, required: true },
    event: { type: String, required: true }, // e.g. INVOICE_GENERATED, WARRANTY_EXPIRING
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntityType: { type: String, default: '' },
    relatedEntityId: { type: Schema.Types.ObjectId, default: null },
    status: { type: String, enum: ['SENT', 'FAILED', 'SKIPPED'], default: 'SENT' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ storeId: 1, customerId: 1, createdAt: -1 });
notificationSchema.index({ storeId: 1, userId: 1, createdAt: -1 });

export const Notification = model('Notification', notificationSchema);
