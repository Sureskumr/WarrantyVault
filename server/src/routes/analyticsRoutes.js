import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext, requireRole(ROLES.OWNER, ROLES.MANAGER));

router.get('/dashboard', analyticsController.dashboard);
router.get('/sales-trend', analyticsController.salesTrend);
router.get('/top-products', analyticsController.topProducts);
router.get('/product-failure', analyticsController.productFailure);
router.get('/claims-trend', analyticsController.claimsTrend);

export default router;
