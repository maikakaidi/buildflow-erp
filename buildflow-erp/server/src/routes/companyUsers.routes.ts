import { Router } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { authenticate, requireRole } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: any, next: any) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Entreprise requise' });

    const users = await prisma.user.findMany({
      where: { companyId, isSuperAdmin: false },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, phoneCode: true, role: true, isActive: true, avatar: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { items: users, total: users.length } });
  } catch (error) { next(error); }
});

router.post('/', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Entreprise requise' });

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { maxUsers: true } });
    const maxUsers = company?.maxUsers ?? 3;

    const activeCount = await prisma.user.count({ where: { companyId, isSuperAdmin: false, isActive: true } });
    if (activeCount >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: `Limite de ${maxUsers} utilisateurs atteinte. Payez 20 000 FCFA sur WhatsApp (Airtel 99293329 ou Orange 92666942) pour ajouter un utilisateur supplémentaire.`,
        limitReached: true,
        paymentInfo: { moov: '99293329', airtel: '92666942', amount: '20 000 FCFA', maxUsers },
      });
    }

    const { firstName, lastName, email, phone, phoneCode = '+227', password, role = 'EMPLOYEE' } = req.body;
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, phone, phoneCode, password: hashed, role, companyId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, phoneCode: true, role: true, isActive: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Ce téléphone est déjà utilisé' });
    next(error);
  }
});

router.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const existing = await prisma.user.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    const { firstName, lastName, email, role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, email, role, isActive },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, phoneCode: true, role: true, isActive: true },
    });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

router.delete('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const existing = await prisma.user.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) { next(error); }
});

export default router;
