import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_VALUES, ROLES } from '../constants/enums.js';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Invalid phone number'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_VALUES, required: true, default: ROLES.CUSTOMER },
    // Staff roles (OWNER/MANAGER/CASHIER/TECHNICIAN) belong to exactly one store.
    // CUSTOMER accounts may also carry a storeId for the store they primarily shop at,
    // but customer data access is scoped by the Customer record, not this field.
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null, index: true },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false, default: null },
    passwordResetTokenHash: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ storeId: 1, role: 1 });

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

export const User = model('User', userSchema);
