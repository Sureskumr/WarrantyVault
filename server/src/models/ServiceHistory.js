import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const serviceHistorySchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, required: true }, // snapshot of ServiceRequest.status at this action
    note: { type: String, trim: true, default: '' },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

serviceHistorySchema.index({ storeId: 1, serviceRequestId: 1, timestamp: 1 });
serviceHistorySchema.index({ storeId: 1, productId: 1, timestamp: -1 });

export const ServiceHistory = model('ServiceHistory', serviceHistorySchema);
