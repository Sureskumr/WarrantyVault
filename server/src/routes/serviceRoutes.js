import { Router } from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createServiceRequestSchema,
  verifyRequestSchema,
  assignTechnicianSchema,
  updateStatusSchema,
  listServiceRequestsQuerySchema,
  requestIdParamSchema,
  productIdParamSchema,
} from '../validators/serviceValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

const staffOnly = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER);
const managerUp = requireRole(ROLES.OWNER, ROLES.MANAGER);
const anyStaff = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER, ROLES.TECHNICIAN);

router.post('/', staffOnly, validate({ body: createServiceRequestSchema }), serviceController.createServiceRequest);
router.get('/', anyStaff, validate({ query: listServiceRequestsQuerySchema }), serviceController.listServiceRequests);
router.get('/:id', anyStaff, validate({ params: requestIdParamSchema }), serviceController.getServiceRequest);
router.patch('/:id/verify', managerUp, validate({ params: requestIdParamSchema, body: verifyRequestSchema }), serviceController.verifyServiceRequest);
router.patch('/:id/assign', managerUp, validate({ params: requestIdParamSchema, body: assignTechnicianSchema }), serviceController.assignTechnician);
router.patch(
  '/:id/status',
  requireRole(ROLES.TECHNICIAN),
  validate({ params: requestIdParamSchema, body: updateStatusSchema }),
  serviceController.updateStatus
);
router.get('/product/:productId/history', anyStaff, validate({ params: productIdParamSchema }), serviceController.getProductHistory);

export default router;
