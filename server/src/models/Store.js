import mongoose from "mongoose";

const { Schema, model } = mongoose;

const storeSettingsSchema = new Schema(
  {
    currency: { type: String, default: "INR" },
    taxInclusive: { type: Boolean, default: false },
    defaultTaxRate: { type: Number, default: 0, min: 0, max: 100 },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
  },
  { _id: false },
);

const storeSchema = new Schema(
  {
    storeName: { type: String, required: true, trim: true, maxlength: 150 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, default: "", uppercase: true },
    logo: { type: String, default: "" }, // Cloudinary/S3 URL
    // Prefix used when minting human-readable invoice numbers, e.g. "INV"
    invoicePrefix: { type: String, trim: true, default: "INV", maxlength: 10 },
    settings: { type: storeSettingsSchema, default: () => ({}) },
    subscriptionPlan: {
      type: String,
      enum: ["FREE", "BASIC", "BUSINESS", "ENTERPRISE"],
      default: "FREE",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

storeSchema.index({ ownerId: 1 });

export const Store = model("Store", storeSchema);
