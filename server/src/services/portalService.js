import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { Warranty } from '../models/Warranty.js';
import { Product } from '../models/Product.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { AppError } from '../utils/AppError.js';
import * as serviceRequestService from './serviceRequestService.js';

/**
 * A CUSTOMER-role User isn't tied to one store (rule: a customer can shop at
 * many stores). Every portal read first resolves the set of Customer records
 * linked to this account (one per store they've bought from) and scopes
 * queries to that set — the portal's own tenant boundary.
 */
async function getLinkedCustomerIds(userId) {
  const customers = await Customer.find({ userId }).select('_id storeId');
  return customers.map((c) => c._id);
}

export async function getMyProfile(userId) {
  return Customer.find({ userId }).populate('storeId', 'storeName');
}

export async function listMyInvoices({ userId, page = 1, limit = 20 }) {
  const customerIds = await getLinkedCustomerIds(userId);
  const filter = { customerId: { $in: customerIds } };
  const [items, total] = await Promise.all([
    Invoice.find(filter).populate('storeId', 'storeName').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Invoice.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getMyInvoiceById({ userId, invoiceId }) {
  const customerIds = await getLinkedCustomerIds(userId);
  const invoice = await Invoice.findOne({ _id: invoiceId, customerId: { $in: customerIds } }).populate('storeId', 'storeName address phone email gstin');
  if (!invoice) throw AppError.notFound('Invoice not found');
  return invoice;
}

export async function listMyWarranties({ userId, page = 1, limit = 20 }) {
  const customerIds = await getLinkedCustomerIds(userId);
  const filter = { customerId: { $in: customerIds } };
  const [docs, total] = await Promise.all([
    Warranty.find(filter).populate('productId', 'name brand images').populate('storeId', 'storeName').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Warranty.countDocuments(filter),
  ]);
  const items = docs.map((w) => ({ ...w.toObject(), status: w.computeStatus(), daysRemaining: w.daysRemaining() }));
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

/**
 * Resolves which Customer record (i.e. which store relationship) a service
 * request should be filed against, based on the product's store.
 */
export async function createMyServiceRequest({ userId, productId, ...rest }) {
  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  const customer = await Customer.findOne({ userId, storeId: product.storeId });
  if (!customer) throw AppError.forbidden('You have no purchase history with this store for this product');

  return serviceRequestService.createServiceRequest({
    storeId: product.storeId,
    customerId: customer._id,
    productId,
    performedBy: null,
    ...rest,
  });
}

export async function listMyServiceRequests({ userId, page = 1, limit = 20 }) {
  const customerIds = await getLinkedCustomerIds(userId);
  const filter = { customerId: { $in: customerIds } };
  const [items, total] = await Promise.all([
    ServiceRequest.find(filter).populate('productId', 'name brand').populate('technicianId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ServiceRequest.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}
