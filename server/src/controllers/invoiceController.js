import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as invoiceService from '../services/invoiceService.js';
import { generateInvoicePdfBuffer } from '../services/pdfService.js';
import { Store } from '../models/Store.js';

export const createInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.createInvoice({ actingUser: req.user, ...req.body, req });
  return sendSuccess(res, { statusCode: 201, message: 'Invoice generated and warranty registered', data: { invoice } });
});

export const listInvoices = catchAsync(async (req, res) => {
  const result = await invoiceService.listInvoices({ storeId: req.user.storeId, ...req.query });
  return sendSuccess(res, {
    message: 'Invoices',
    data: { invoices: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const getInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById({ storeId: req.user.storeId, invoiceId: req.params.id });
  return sendSuccess(res, { message: 'Invoice details', data: { invoice } });
});

export const downloadInvoicePdf = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById({ storeId: req.user.storeId, invoiceId: req.params.id });
  const store = await Store.findById(req.user.storeId);
  const buffer = await generateInvoicePdfBuffer({ store, customer: invoice.customerId, invoice });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(buffer);
});
