import { Router } from 'express';
import { z } from 'zod';
import * as auditLogController from '../controllers/auditLogController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AUDIT_ACTION_VALUES, ROLES } from '../constants/enums.js';

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  action: z.enum(AUDIT_ACTION_VALUES).optional(),
  entityType: z.string().max(50).optional(),
});

router.use(requireAuth, requireStoreContext, requireRole(ROLES.OWNER, ROLES.MANAGER));
router.get('/', validate({ query: listQuerySchema }), auditLogController.listAuditLogs);

export default router;
