import { Router } from 'express';
import authRoutes from './authRoutes.js';
import storeRoutes from './storeRoutes.js';
import userRoutes from './userRoutes.js';
import customerRoutes from './customerRoutes.js';
import productRoutes from './productRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import warrantyRoutes from './warrantyRoutes.js';
import warrantyClaimRoutes from './warrantyClaimRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import technicianRoutes from './technicianRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import verificationRoutes from './verificationRoutes.js';
import portalRoutes from './portalRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/warranties', warrantyRoutes);
router.use('/warranty-claims', warrantyClaimRoutes);
router.use('/services', serviceRoutes);
router.use('/technicians', technicianRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/verification', verificationRoutes);
router.use('/portal', portalRoutes);

export default router;
