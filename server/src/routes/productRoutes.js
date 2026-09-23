import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAuth, requireRole, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
} from '../validators/productValidators.js';
import { ROLES } from '../constants/enums.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

const canManage = requireRole(ROLES.OWNER, ROLES.MANAGER);
const canView = requireRole(ROLES.OWNER, ROLES.MANAGER, ROLES.CASHIER, ROLES.TECHNICIAN);

router.post('/', canManage, validate({ body: createProductSchema }), productController.createProduct);
router.get('/', canView, validate({ query: listProductsQuerySchema }), productController.listProducts);
router.get('/:id', canView, validate({ params: productIdParamSchema }), productController.getProduct);
router.put(
  '/:id',
  canManage,
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productController.updateProduct
);
router.delete('/:id', canManage, validate({ params: productIdParamSchema }), productController.deleteProduct);

export default router;
