import { z } from 'zod';
import { SERVICE_STATUS_VALUES } from '../constants/enums.js';

export const createServiceRequestSchema = z.object({
  productId: z.string().length(24),
  problemDescription: z.string().min(5).max(2000),
  photos: z.array(z.string().url()).optional(),
  video: z.string().url().optional(),
  preferredDate: z.coerce.date().optional(),
  preferredTime: z.string().max(50).optional(),
  contactPhone: z.string().min(7).max(15),
  customerId: z.string().length(24).optional(), // set by staff when raising on a customer's behalf
});

export const verifyRequestSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().max(300).optional(),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().length(24),
});

export const updateStatusSchema = z.object({
  nextStatus: z.enum(SERVICE_STATUS_VALUES),
  diagnosis: z.string().max(2000).optional(),
  repairNotes: z.string().max(2000).optional(),
  partsUsed: z.array(z.string()).optional(),
  photos: z.array(z.string().url()).optional(),
  note: z.string().max(500).optional(),
});

export const listServiceRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(SERVICE_STATUS_VALUES).optional(),
});

export const requestIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid service request id'),
});

export const productIdParamSchema = z.object({
  productId: z.string().length(24, 'Invalid product id'),
});
