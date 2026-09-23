import { z } from 'zod';

export const updateStoreSchema = z.object({
  storeName: z.string().min(2).max(150).optional(),
  phone: z.string().min(7).max(15).optional(),
  email: z.string().email().optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(12).optional(),
  gstin: z.string().max(20).optional(),
  logo: z.string().url().optional(),
  invoicePrefix: z.string().min(1).max(10).optional(),
  settings: z
    .object({
      currency: z.string().length(3).optional(),
      taxInclusive: z.boolean().optional(),
      defaultTaxRate: z.number().min(0).max(100).optional(),
      notificationPreferences: z
        .object({
          email: z.boolean().optional(),
          sms: z.boolean().optional(),
          whatsapp: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});
