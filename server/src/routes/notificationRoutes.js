import { Router } from 'express';
import { z } from 'zod';
import * as notificationController from '../controllers/notificationController.js';
import { requireAuth, requireStoreContext } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireStoreContext);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const idParamSchema = z.object({ id: z.string().length(24) });

router.get('/', validate({ query: listQuerySchema }), notificationController.listMine);
router.patch('/:id/read', validate({ params: idParamSchema }), notificationController.markRead);

export default router;
