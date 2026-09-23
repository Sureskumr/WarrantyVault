import mongoose from 'mongoose';
import { WARRANTY_START_TYPE_VALUES, WARRANTY_START_TYPES, DURATION_UNIT_VALUES, DURATION_UNITS } from '../constants/enums.js';

const { Schema, model } = mongoose;

// A product does NOT hard-code "warranty = purchaseDate + 365 days".
// Instead it carries a reusable warranty template that Warranty.registerFromProduct()
// (see services/warrantyService.js) reads when a sale happens.
const warrantyTemplateSchema = new Schema(
  {
    duration: { type: Number, required: true, min: 0, default: 12 },
    durationUnit: { type: String, enum: DURATION_UNIT_VALUES, default: DURATION_UNITS.MONTHS },
    startType: { type: String, enum: WARRANTY_START_TYPE_VALUES, default: WARRANTY_START_TYPES.PURCHASE_DATE },
    provider: { type: String, trim: true, default: '' }, // e.g. manufacturer or store
    terms: { type: String, trim: true, default: '' },
    coveredComponents: { type: [String], default: [] },
    excludedConditions: { type: [String], default: [] },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    brand: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    modelNumber: { type: String, trim: true, default: '' },
    sku: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, trim: true, default: '' },
    // Whether a serial number must be captured per unit at billing time
    // (e.g. appliances) vs. not applicable (e.g. accessories).
    serialNumberRequired: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    stockQuantity: { type: Number, min: 0, default: 0 },
    warrantyTemplate: { type: warrantyTemplateSchema, default: () => ({}) },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    // Soft-delete: a product with billing history is never hard-deleted (rule #13)
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, sku: 1 }, { unique: true });
productSchema.index({ storeId: 1, barcode: 1 });
productSchema.index({ storeId: 1, name: 'text', brand: 'text' });

export const Product = model('Product', productSchema);
