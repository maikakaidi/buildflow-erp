import { Router } from 'express';
import { SuperAdminController } from '../controllers/superAdmin.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/dashboard', SuperAdminController.getDashboard);
router.get('/stats', SuperAdminController.getStats);

router.post('/companies', SuperAdminController.createCompany);
router.put('/companies/:id', SuperAdminController.updateCompany);
router.delete('/companies/:id', SuperAdminController.deleteCompany);
router.post('/companies/:id/suspend', SuperAdminController.suspendCompany);
router.post('/companies/:id/reactivate', SuperAdminController.reactivateCompany);

router.post('/subscriptions/:id/renew', SuperAdminController.renewSubscription);
router.post('/subscriptions/:id/add-days', SuperAdminController.addFreeDays);

router.get('/users', SuperAdminController.getAllUsers);
router.post('/users', SuperAdminController.createUser);
router.post('/users/:id/reset-password', SuperAdminController.resetPassword);

router.get('/payments', SuperAdminController.getPayments);
router.post('/payments', SuperAdminController.updatePaymentInfo);

export default router;
