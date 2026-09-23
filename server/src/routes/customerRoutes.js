import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  customerIdParamSchema,
} from '../validators/customerValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

const canWrite = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER);
const canRead = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER);

router.post('/', canWrite, validate({ body: createCustomerSchema }), customerController.createCustomer);
router.get('/', canRead, validate({ query: listCustomersQuerySchema }), customerController.listCustomers);
router.get('/:id', canRead, validate({ params: customerIdParamSchema }), customerController.getCustomer);
router.put(
  '/:id',
  canWrite,
  validate({ params: customerIdParamSchema, body: updateCustomerSchema }),
  customerController.updateCustomer
);

export default router;
