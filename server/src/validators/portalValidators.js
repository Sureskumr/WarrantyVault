import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({ id: z.string().length(24) });

export const createMyServiceRequestSchema = z.object({
  productId: z.string().length(24),
  problemDescription: z.string().min(5).max(2000),
  photos: z.array(z.string().url()).optional(),
  video: z.string().url().optional(),
  preferredDate: z.coerce.date().optional(),
  preferredTime: z.string().max(50).optional(),
  contactPhone: z.string().min(7).max(15),
});
