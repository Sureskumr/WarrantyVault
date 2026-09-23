import { Invoice } from '../models/Invoice.js';
import { Warranty } from '../models/Warranty.js';
import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/AppError.js';
import { maskName } from '../utils/mask.js';
import * as otpService from './otpService.js';
import { OTP_PURPOSES } from '../constants/enums.js';

async function buildPublicSummary(invoice) {
  const warranties = await Warranty.find({ invoiceId: invoice._id }).populate('productId', 'name brand');
  const customer = await Customer.findById(invoice.customerId);

  return {
    verified: true,
    invoiceNumber: invoice.invoiceNumber,
    purchaseDate: invoice.purchaseDate,
    customer: { name: 'Verified Customer' }, // spec §9: never expose full customer identity publicly
    items: warranties.map((w) => ({
      product: w.productId?.name,
      brand: w.productId?.brand,
      warranty: {
        status: w.computeStatus(),
        daysRemaining: w.daysRemaining(),
        startDate: w.startDate,
        endDate: w.endDate,
      },
    })),
    _internalInvoiceId: invoice._id.toString(),
    _internalCustomerPhone: customer?.phone,
  };
}

/**
 * Public QR-scan endpoint. Never requires OTP — matches spec §9's "Public
 * QR verification" example, which intentionally shows only non-sensitive
 * fields (no full phone/address, generic "Verified Customer" label).
 */
export async function verifyByToken(token) {
  const invoice = await Invoice.findOne({ verificationToken: token });
  if (!invoice) throw AppError.notFound('Invoice not found or verification code is invalid');
  const summary = await buildPublicSummary(invoice);
  delete summary._internalInvoiceId;
  delete summary._internalCustomerPhone;
  return summary;
}

/**
 * Lookup by invoice ID, serial number, or customer phone — the first step
 * before an OTP-gated reveal. Returns only the masked summary; the caller
 * must then call sendVerificationOtp with the returned invoiceId to
 * request OTP delivery to the phone on file (never a phone the caller supplies).
 */
export async function lookup({ invoiceNumber, serialNumber, phone }) {
  let invoice = null;

  if (invoiceNumber) {
    invoice = await Invoice.findOne({ invoiceNumber });
  } else if (serialNumber) {
    const warranty = await Warranty.findOne({ serialNumber });
    if (warranty) invoice = await Invoice.findById(warranty.invoiceId);
  } else if (phone) {
    const customer = await Customer.findOne({ phone });
    if (customer) invoice = await Invoice.findOne({ customerId: customer._id }).sort({ createdAt: -1 });
  } else {
    throw AppError.badRequest('Provide an invoice number, serial number, or phone number');
  }

  if (!invoice) throw AppError.notFound('No matching invoice/warranty found');

  const summary = await buildPublicSummary(invoice);
  return { ...summary, customer: { name: maskName((await Customer.findById(invoice.customerId))?.name || '') } };
}

export async function sendVerificationOtp({ invoiceNumber }) {
  const invoice = await Invoice.findOne({ invoiceNumber });
  if (!invoice) throw AppError.notFound('Invoice not found');
  const customer = await Customer.findById(invoice.customerId);
  if (!customer?.phone) throw AppError.badRequest('No phone number on file for this customer');

  const { devOtp } = await otpService.sendOtp({
    phone: customer.phone,
    purpose: OTP_PURPOSES.WARRANTY_VERIFICATION,
    referenceId: invoice._id,
    storeId: invoice.storeId,
  });

  return { sent: true, maskedPhone: `${customer.phone.slice(0, 2)}${'•'.repeat(customer.phone.length - 4)}${customer.phone.slice(-2)}`, devOtp };
}

export async function verifyWithOtp({ invoiceNumber, code }) {
  const invoice = await Invoice.findOne({ invoiceNumber });
  if (!invoice) throw AppError.notFound('Invoice not found');
  const customer = await Customer.findById(invoice.customerId);

  await otpService.verifyOtp({
    phone: customer.phone,
    purpose: OTP_PURPOSES.WARRANTY_VERIFICATION,
    referenceId: invoice._id,
    code,
  });

  const warranties = await Warranty.find({ invoiceId: invoice._id }).populate('productId', 'name brand modelNumber');
  return {
    verified: true,
    otpVerified: true,
    invoiceNumber: invoice.invoiceNumber,
    purchaseDate: invoice.purchaseDate,
    customer: { name: customer.name, phone: customer.phone },
    items: warranties.map((w) => ({
      product: w.productId?.name,
      brand: w.productId?.brand,
      serialNumber: w.serialNumber,
      warranty: {
        status: w.computeStatus(),
        daysRemaining: w.daysRemaining(),
        startDate: w.startDate,
        endDate: w.endDate,
        terms: w.terms,
        coveredComponents: w.coveredComponents,
      },
      warrantyId: w._id,
    })),
  };
}
