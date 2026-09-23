import { z } from 'zod';
import { ROLES } from '../constants/enums.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const createStaffSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(15),
  password: passwordSchema,
  role: z.enum([ROLES.MANAGER, ROLES.CASHIER, ROLES.TECHNICIAN]),
});

export const updateRoleSchema = z.object({
  role: z.enum([ROLES.MANAGER, ROLES.CASHIER, ROLES.TECHNICIAN]),
  reason: z.string().min(3).max(300),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(Object.values(ROLES)).optional(),
  search: z.string().max(100).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid user id'),
});
