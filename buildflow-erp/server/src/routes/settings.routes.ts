import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Entreprise requise' });

    const settings = await prisma.companySetting.findUnique({ where: { companyId } });
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Entreprise requise' });

    const settings = await prisma.companySetting.upsert({
      where: { companyId },
      update: req.body,
      create: { companyId, ...req.body },
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.get('/company', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Entreprise requise' });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

router.put('/company', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Entreprise requise' });

    const company = await prisma.company.update({
      where: { id: companyId },
      data: req.body,
    });

    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

export default router;
