import { Router } from 'express';
import { createCrudRoutes } from '../controllers/module.controller';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

router.use('/chantiers', createCrudRoutes(prisma.chantier));
router.use('/employees', createCrudRoutes(prisma.employee));
router.use('/workers', createCrudRoutes(prisma.worker));
router.use('/suppliers', createCrudRoutes(prisma.supplier));
router.use('/clients', createCrudRoutes(prisma.client));
router.use('/stock-families', createCrudRoutes(prisma.stockFamily));
router.use('/stock-items', createCrudRoutes(prisma.stockItem));
router.use('/stock-movements', createCrudRoutes(prisma.stockMovement));
router.use('/materials', createCrudRoutes(prisma.material));
router.use('/vehicles', createCrudRoutes(prisma.vehicle));
router.use('/locations', createCrudRoutes(prisma.location));
router.use('/contracts', createCrudRoutes(prisma.contract));
router.use('/documents', createCrudRoutes(prisma.document));
router.use('/presences', createCrudRoutes(prisma.presence));
router.use('/salaries', createCrudRoutes(prisma.salary));
router.use('/purchases', createCrudRoutes(prisma.purchase));
router.use('/expenses', createCrudRoutes(prisma.expense));
router.use('/invoices', createCrudRoutes(prisma.invoice));
router.use('/payments', createCrudRoutes(prisma.payment));
router.use('/daily-reports', createCrudRoutes(prisma.dailyReport));
router.use('/notifications', createCrudRoutes(prisma.notification));

export default router;
