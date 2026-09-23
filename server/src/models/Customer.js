import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const customerSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    // Optional link if this customer has also registered a portal account
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Invalid phone number'],
    },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A phone number should identify one customer per store (not globally —
// the same person can be a customer of multiple independent stores).
customerSchema.index({ storeId: 1, phone: 1 }, { unique: true });
customerSchema.index({ storeId: 1, email: 1 });
customerSchema.index({ storeId: 1, name: 'text' });

export const Customer = model('Customer', customerSchema);
