import { Router } from 'express';
import * as storeController from '../controllers/storeController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateStoreSchema } from '../validators/storeValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

router.get('/me', storeController.getMyStore);
router.put(
  '/me',
  requireRole(ROLES.OWNER),
  validate({ body: updateStoreSchema }),
  storeController.updateMyStore
);

export default router;
