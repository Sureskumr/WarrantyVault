import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createStaffSchema, updateRoleSchema, listUsersQuerySchema, userIdParamSchema } from '../validators/userValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

router.post(
  '/',
  requireRole(ROLES.OWNER, ROLES.MANAGER),
  validate({ body: createStaffSchema }),
  userController.createStaff
);
router.get('/', requireRole(ROLES.OWNER, ROLES.MANAGER), validate({ query: listUsersQuerySchema }), userController.listStaff);
router.patch(
  '/:id/deactivate',
  requireRole(ROLES.OWNER, ROLES.MANAGER),
  validate({ params: userIdParamSchema }),
  userController.deactivateStaff
);
router.patch(
  '/:id/role',
  requireRole(ROLES.OWNER),
  validate({ params: userIdParamSchema, body: updateRoleSchema }),
  userController.updateStaffRole
);

export default router;
