import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { Warranty } from "../models/Warranty.js";
import { Customer } from "../models/Customer.js";
import { Store } from "../models/Store.js";
import { AppError } from "../utils/AppError.js";
import {
  generateInvoiceNumber,
  generateVerificationToken,
} from "../utils/idGenerator.js";
import { generateQrDataUrl } from "../utils/qr.js";
import { buildWarrantyFromTemplate } from "./warrantyService.js";
import { recordAudit } from "./auditService.js";
import { notifyCustomer } from "./notificationService.js";
import { AUDIT_ACTIONS } from "../constants/enums.js";
import { env } from "../config/env.js";

/**
 * Creates an invoice and warranty records in a safe, sequential order for
 * standalone MongoDB deployments. If a later step fails, we compensate the
 * earlier writes rather than relying on a replica-set transaction.
 */
export async function createInvoice({
  actingUser,
  customerId,
  items,
  paymentMethod,
  amountPaid,
  req,
}) {
  let invoice = null;
  const createdWarranties = [];
  const createdPayments = [];
  const stockAdjustments = [];

  try {
    const store = await Store.findById(actingUser.storeId);
    if (!store) throw AppError.notFound("Store not found");

    const customer = await Customer.findOne({
      _id: customerId,
      storeId: actingUser.storeId,
    });
    if (!customer) throw AppError.notFound("Customer not found");

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      storeId: actingUser.storeId,
      isDeleted: false,
    });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const invoiceItems = [];

    for (const line of items) {
      const product = productMap.get(line.productId);
      if (!product)
        throw AppError.badRequest(
          `Product ${line.productId} not found in this store`,
        );
      if (product.serialNumberRequired && !line.serialNumber) {
        throw AppError.badRequest(
          `Serial number is required for ${product.name}`,
        );
      }
      if (product.stockQuantity < line.quantity) {
        throw AppError.badRequest(
          `Insufficient stock for ${product.name} (have ${product.stockQuantity}, need ${line.quantity})`,
        );
      }

      const discount = line.discount || 0;
      const lineSubtotal = product.price * line.quantity - discount;
      const lineTax = (lineSubtotal * (product.taxRate || 0)) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += product.price * line.quantity;
      totalDiscount += discount;
      totalTax += lineTax;

      invoiceItems.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        serialNumber: line.serialNumber || "",
        quantity: line.quantity,
        unitPrice: product.price,
        discount,
        taxRate: product.taxRate || 0,
        lineTotal,
        warrantyEligible: true,
      });

      stockAdjustments.push({
        productId: product._id,
        quantity: line.quantity,
      });
    }

    const grandTotal = subtotal - totalDiscount + totalTax;
    const purchaseDate = new Date();
    const invoiceNumber = generateInvoiceNumber(store.invoicePrefix);
    const verificationToken = generateVerificationToken();
    const verificationUrl = `${env.CLIENT_URL}/verify/invoice/${verificationToken}`;
    const qrCodeDataUrl = await generateQrDataUrl(verificationUrl);

    invoice = await Invoice.create({
      storeId: actingUser.storeId,
      customerId,
      createdBy: actingUser.id,
      invoiceNumber,
      items: invoiceItems,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      paymentMethod,
      amountPaid,
      purchaseDate,
      verificationToken,
      qrCodeDataUrl,
    });

    for (let idx = 0; idx < invoiceItems.length; idx++) {
      const line = items[idx];
      const product = productMap.get(line.productId);
      const warranty = buildWarrantyFromTemplate({
        product,
        storeId: actingUser.storeId,
        invoiceId: invoice._id,
        customerId,
        serialNumber: line.serialNumber,
        purchaseDate,
      });
      const savedWarranty = await warranty.save();
      createdWarranties.push(savedWarranty);
      invoice.items[idx].warrantyId = savedWarranty._id;
    }
    await invoice.save();

    const payment = await Payment.create({
      storeId: actingUser.storeId,
      invoiceId: invoice._id,
      customerId,
      amount: amountPaid,
      method: paymentMethod,
    });
    createdPayments.push(payment);

    for (const adjustment of stockAdjustments) {
      const product = await Product.findById(adjustment.productId);
      if (!product) {
        throw AppError.badRequest(
          `Product ${adjustment.productId} not found in this store`,
        );
      }
      product.stockQuantity -= adjustment.quantity;
      await product.save();
    }
  } catch (error) {
    for (const payment of [...createdPayments].reverse()) {
      await Payment.findByIdAndDelete(payment._id).catch(() => {});
    }

    for (const warranty of [...createdWarranties].reverse()) {
      await Warranty.findByIdAndDelete(warranty._id).catch(() => {});
    }

    if (invoice?._id) {
      await Invoice.findByIdAndDelete(invoice._id).catch(() => {});
    }

    for (const adjustment of [...stockAdjustments].reverse()) {
      await Product.findByIdAndUpdate(adjustment.productId, {
        $inc: { stockQuantity: adjustment.quantity },
      }).catch(() => {});
    }

    throw error;
  }

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.INVOICE_CREATED,
    entityType: "Invoice",
    entityId: invoice._id,
    newValue: {
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: invoice.grandTotal,
    },
    req,
  });
  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.WARRANTY_REGISTERED,
    entityType: "Invoice",
    entityId: invoice._id,
    newValue: { itemCount: invoice.items.length },
    req,
  });

  // Fire-and-forget: notification failures must never fail a completed sale.
  notifyCustomer({
    storeId: actingUser.storeId,
    customerId,
    event: "INVOICE_GENERATED",
    title: "Your invoice is ready",
    message: `Invoice ${invoice.invoiceNumber} for Rs. ${invoice.grandTotal.toFixed(2)} has been generated with warranty registered automatically.`,
    relatedEntityType: "Invoice",
    relatedEntityId: invoice._id,
  }).catch(() => {});

  return invoice;
}

export async function listInvoices({ storeId, page, limit, customerId }) {
  const filter = { storeId };
  if (customerId) filter.customerId = customerId;

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getInvoiceById({ storeId, invoiceId }) {
  const invoice = await Invoice.findOne({ _id: invoiceId, storeId })
    .populate("customerId", "name phone email address city state pincode")
    .populate("createdBy", "name");
  if (!invoice)
    throw AppError.notFound("Invoice not found", "INVOICE_NOT_FOUND");
  return invoice;
}
