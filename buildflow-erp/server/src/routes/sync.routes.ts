import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/push', SyncController.push);
router.get('/pull', SyncController.pull);
router.get('/pull-all', SyncController.pullAll);
router.get('/conflicts', SyncController.getConflicts);
router.post('/conflicts/:id/resolve', SyncController.resolveConflict);
router.get('/logs', SyncController.getLogs);

export default router;
