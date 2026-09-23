import mongoose from 'mongoose';
import { OTP_PURPOSE_VALUES } from '../constants/enums.js';

const { Schema, model } = mongoose;

const otpVerificationSchema = new Schema(
  {
    // Identifies who the OTP was sent to — phone is primary channel, email optional fallback.
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    hashedOtp: { type: String, required: true },
    purpose: { type: String, enum: OTP_PURPOSE_VALUES, required: true },
    // Free-form reference to what this OTP is gating, e.g. an invoice or service request id.
    referenceId: { type: Schema.Types.ObjectId, default: null },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null, index: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpVerificationSchema.index({ phone: 1, purpose: 1, createdAt: -1 });
// TTL cleanup — Mongo removes the document automatically ~1 hour past expiry.
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const OtpVerification = model('OtpVerification', otpVerificationSchema);
