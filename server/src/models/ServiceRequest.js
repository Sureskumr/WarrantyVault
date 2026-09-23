import mongoose from 'mongoose';
import { SERVICE_STATUS_VALUES, SERVICE_STATUSES } from '../constants/enums.js';

const { Schema, model } = mongoose;

const serviceRequestSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warrantyId: { type: Schema.Types.ObjectId, ref: 'Warranty', default: null },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    problemDescription: { type: String, required: true, trim: true, maxlength: 2000 },
    photos: { type: [String], default: [] },
    video: { type: String, default: '' },
    preferredDate: { type: Date, default: null },
    preferredTime: { type: String, default: '' },
    contactPhone: { type: String, required: true, trim: true },

    status: { type: String, enum: SERVICE_STATUS_VALUES, default: SERVICE_STATUSES.CREATED },
    diagnosis: { type: String, trim: true, default: '' },
    repairNotes: { type: String, trim: true, default: '' },
    partsUsed: { type: [String], default: [] },
    rejectionReason: { type: String, trim: true, default: '' },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null when raised via customer portal by customerId directly
  },
  { timestamps: true }
);

serviceRequestSchema.index({ storeId: 1, customerId: 1, createdAt: -1 });
serviceRequestSchema.index({ storeId: 1, technicianId: 1, status: 1 });
serviceRequestSchema.index({ storeId: 1, status: 1, createdAt: -1 });

export const ServiceRequest = model('ServiceRequest', serviceRequestSchema);
