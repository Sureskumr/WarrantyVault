import { z } from 'zod';
import { PAYMENT_METHOD_VALUES } from '../constants/enums.js';

const lineItemSchema = z.object({
  productId: z.string().length(24, 'Invalid product id'),
  quantity: z.number().int().min(1),
  serialNumber: z.string().max(100).optional(),
  discount: z.number().min(0).optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().length(24, 'Invalid customer id'),
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
  amountPaid: z.number().min(0),
});

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  customerId: z.string().length(24).optional(),
});

export const invoiceIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid invoice id'),
});
