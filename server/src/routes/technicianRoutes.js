import { Router } from 'express';
import * as technicianController from '../controllers/technicianController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

router.get('/', requireRole(ROLES.OWNER, ROLES.MANAGER), technicianController.listTechnicians);
router.get('/me/dashboard', requireRole(ROLES.TECHNICIAN), technicianController.myDashboard);

export default router;
