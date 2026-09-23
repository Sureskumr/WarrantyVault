import mongoose from 'mongoose';
import { PAYMENT_METHOD_VALUES } from '../constants/enums.js';

const { Schema, model } = mongoose;

const paymentSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    reference: { type: String, trim: true, default: '' }, // e.g. UPI txn id, card last4
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'REFUNDED'], default: 'SUCCESS' },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ storeId: 1, invoiceId: 1 });

export const Payment = model('Payment', paymentSchema);
