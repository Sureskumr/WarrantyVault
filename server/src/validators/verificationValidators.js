import { z } from 'zod';

export const lookupSchema = z
  .object({
    invoiceNumber: z.string().optional(),
    serialNumber: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((v) => v.invoiceNumber || v.serialNumber || v.phone, {
    message: 'Provide an invoice number, serial number, or phone number',
  });

export const sendOtpSchema = z.object({
  invoiceNumber: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  invoiceNumber: z.string().min(1),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const tokenParamSchema = z.object({
  token: z.string().min(10),
});
