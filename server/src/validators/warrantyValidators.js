import { z } from 'zod';
import { WARRANTY_STATUS_VALUES } from '../constants/enums.js';

export const listWarrantiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  customerId: z.string().length(24).optional(),
  status: z.enum(WARRANTY_STATUS_VALUES).optional(),
});

export const warrantyIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid warranty id'),
});

export const setManualStatusSchema = z.object({
  manualStatus: z.enum(['SUSPENDED', 'CANCELLED', null]).nullable(),
  reason: z.string().min(3).max(300),
});
