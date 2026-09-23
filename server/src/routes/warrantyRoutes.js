import { Router } from 'express';
import * as warrantyController from '../controllers/warrantyController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listWarrantiesQuerySchema, warrantyIdParamSchema, setManualStatusSchema } from '../validators/warrantyValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

const canView = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER, ROLES.TECHNICIAN);

router.get('/', canView, validate({ query: listWarrantiesQuerySchema }), warrantyController.listWarranties);
router.get('/:id', canView, validate({ params: warrantyIdParamSchema }), warrantyController.getWarranty);
router.patch(
  '/:id/status',
  requireRole(ROLES.OWNER),
  validate({ params: warrantyIdParamSchema, body: setManualStatusSchema }),
  warrantyController.setManualStatus
);

export default router;
