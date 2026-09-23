import { Router } from 'express';
import { z } from 'zod';
import * as warrantyClaimController from '../controllers/warrantyClaimController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CLAIM_STATUS_VALUES, ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(CLAIM_STATUS_VALUES).optional(),
});
const idParamSchema = z.object({ id: z.string().length(24) });
const updateSchema = z.object({
  status: z.enum(CLAIM_STATUS_VALUES),
  resolution: z.string().max(2000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

const anyStaff = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER, ROLES.TECHNICIAN);
const managerUp = requireRole(ROLES.OWNER, ROLES.MANAGER);

router.get('/', anyStaff, validate({ query: listQuerySchema }), warrantyClaimController.listClaims);
router.get('/:id', anyStaff, validate({ params: idParamSchema }), warrantyClaimController.getClaim);
router.patch('/:id', managerUp, validate({ params: idParamSchema, body: updateSchema }), warrantyClaimController.updateClaim);

export default router;
