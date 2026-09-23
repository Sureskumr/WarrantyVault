import { Router } from 'express';
import * as portalController from '../controllers/portalController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listQuerySchema, idParamSchema, createMyServiceRequestSchema } from '../validators/portalValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.CUSTOMER));

router.get('/profile', portalController.myProfile);
router.get('/invoices', validate({ query: listQuerySchema }), portalController.myInvoices);
router.get('/invoices/:id', validate({ params: idParamSchema }), portalController.myInvoiceDetail);
router.get('/invoices/:id/pdf', validate({ params: idParamSchema }), portalController.myInvoicePdf);
router.get('/warranties', validate({ query: listQuerySchema }), portalController.myWarranties);
router.post('/service-requests', validate({ body: createMyServiceRequestSchema }), portalController.createServiceRequest);
router.get('/service-requests', validate({ query: listQuerySchema }), portalController.myServiceRequests);
router.get('/notifications', validate({ query: listQuerySchema }), portalController.myNotifications);

export default router;
