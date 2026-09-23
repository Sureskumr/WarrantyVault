import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(15),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(12).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(), // matches name/phone/email
});

export const customerIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid customer id'),
});
