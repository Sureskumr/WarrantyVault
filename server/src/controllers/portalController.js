import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as portalService from '../services/portalService.js';
import { generateInvoicePdfBuffer } from '../services/pdfService.js';
import { Store } from '../models/Store.js';
import { Customer } from '../models/Customer.js';
import * as notificationService from '../services/notificationService.js';

export const myProfile = catchAsync(async (req, res) => {
  const customerRecords = await portalService.getMyProfile(req.user.id);
  return sendSuccess(res, { message: 'My profile', data: { customerRecords } });
});

export const myInvoices = catchAsync(async (req, res) => {
  const result = await portalService.listMyInvoices({ userId: req.user.id, ...req.query });
  return sendSuccess(res, {
    message: 'My invoices',
    data: { invoices: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const myInvoiceDetail = catchAsync(async (req, res) => {
  const invoice = await portalService.getMyInvoiceById({ userId: req.user.id, invoiceId: req.params.id });
  return sendSuccess(res, { message: 'Invoice details', data: { invoice } });
});

export const myInvoicePdf = catchAsync(async (req, res) => {
  const invoice = await portalService.getMyInvoiceById({ userId: req.user.id, invoiceId: req.params.id });
  const store = await Store.findById(invoice.storeId);
  const customer = await Customer.findById(invoice.customerId);
  const buffer = await generateInvoicePdfBuffer({ store, customer, invoice });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(buffer);
});

export const myWarranties = catchAsync(async (req, res) => {
  const result = await portalService.listMyWarranties({ userId: req.user.id, ...req.query });
  return sendSuccess(res, {
    message: 'My warranties',
    data: { warranties: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const createServiceRequest = catchAsync(async (req, res) => {
  const request = await portalService.createMyServiceRequest({ userId: req.user.id, ...req.body });
  return sendSuccess(res, { statusCode: 201, message: 'Service request submitted', data: { request } });
});

export const myServiceRequests = catchAsync(async (req, res) => {
  const result = await portalService.listMyServiceRequests({ userId: req.user.id, ...req.query });
  return sendSuccess(res, {
    message: 'My service requests',
    data: { requests: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const myNotifications = catchAsync(async (req, res) => {
  const customerRecords = await portalService.getMyProfile(req.user.id);
  const storeIds = customerRecords.map((c) => c.storeId?._id || c.storeId);
  const customerIds = customerRecords.map((c) => c._id);
  // Notifications are store-scoped by design; aggregate across every store
  // this customer has a relationship with.
  const results = await Promise.all(
    storeIds.map((storeId, i) => notificationService.listNotificationsForCustomer({ storeId, customerId: customerIds[i], ...req.query }))
  );
  const notifications = results.flatMap((r) => r.items).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return sendSuccess(res, { message: 'My notifications', data: { notifications } });
});
