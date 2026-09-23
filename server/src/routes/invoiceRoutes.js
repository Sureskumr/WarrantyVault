import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createInvoiceSchema, listInvoicesQuerySchema, invoiceIdParamSchema } from '../validators/invoiceValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

const canBill = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER);
const canView = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER);

router.post('/', canBill, validate({ body: createInvoiceSchema }), invoiceController.createInvoice);
router.get('/', canView, validate({ query: listInvoicesQuerySchema }), invoiceController.listInvoices);
router.get('/:id', canView, validate({ params: invoiceIdParamSchema }), invoiceController.getInvoice);
router.get('/:id/pdf', canView, validate({ params: invoiceIdParamSchema }), invoiceController.downloadInvoicePdf);

export default router;
