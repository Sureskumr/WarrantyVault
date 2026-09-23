import mongoose from "mongoose";
import { PAYMENT_METHOD_VALUES } from "../constants/enums.js";

const { Schema, model } = mongoose;

// InvoiceItem is modeled as an embedded subdocument rather than its own
// top-level collection: it has no independent lifecycle outside its parent
// invoice, is always read/written together with it, and an invoice is never
// expected to hold more than a few dozen lines — a textbook embedding case
// that keeps invoice reads to a single query without fragmenting billing
// logic across collections.
const invoiceItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot at sale time, survives product edits
    sku: { type: String, required: true },
    serialNumber: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    lineTotal: { type: Number, required: true, min: 0 },
    warrantyEligible: { type: Boolean, default: false },
    warrantyId: { type: Schema.Types.ObjectId, ref: "Warranty", default: null },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNumber: { type: String, required: true },
    items: { type: [invoiceItemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      required: true,
    },
    amountPaid: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now },
    verificationToken: { type: String, required: true },
    qrCodeDataUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["FINALIZED", "CANCELLED"],
      default: "FINALIZED",
    },
  },
  { timestamps: true },
);

invoiceSchema.index({ storeId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ storeId: 1, customerId: 1 });
invoiceSchema.index({ storeId: 1, createdAt: -1 });
invoiceSchema.index({ verificationToken: 1 }, { unique: true });

// Rule #14: invoices are never physically deleted once finalized — cancellation
// (see invoiceService.cancelInvoice) only flips `status`, the document persists.
export const Invoice = model("Invoice", invoiceSchema);
