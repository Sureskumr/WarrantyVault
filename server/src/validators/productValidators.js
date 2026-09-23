import { z } from 'zod';
import { WARRANTY_START_TYPE_VALUES, DURATION_UNIT_VALUES } from '../constants/enums.js';

const warrantyTemplateSchema = z.object({
  duration: z.number().min(0).default(12),
  durationUnit: z.enum(DURATION_UNIT_VALUES).default('MONTHS'),
  startType: z.enum(WARRANTY_START_TYPE_VALUES).default('PURCHASE_DATE'),
  provider: z.string().max(150).optional(),
  terms: z.string().max(2000).optional(),
  coveredComponents: z.array(z.string()).optional(),
  excludedConditions: z.array(z.string()).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  sku: z.string().min(1).max(60),
  barcode: z.string().max(60).optional(),
  serialNumberRequired: z.boolean().optional(),
  price: z.number().min(0),
  taxRate: z.number().min(0).max(100).optional(),
  stockQuantity: z.number().min(0).optional(),
  warrantyTemplate: warrantyTemplateSchema.optional(),
  images: z.array(z.string().url()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid product id'),
});
