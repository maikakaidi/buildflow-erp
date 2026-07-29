import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

async function generateAutoNotifications(companyId: string) {
  const notifications: Array<{ companyId: string; type: string; title: string; message: string; severity: string }> = [];

  const lowStock = await prisma.stockItem.findMany({ where: { companyId, quantity: { lte: 2 } }, select: { id: true, name: true, quantity: true } });
  for (const item of lowStock) {
    notifications.push({ companyId, type: 'STOCK_FAIBLE', title: 'Stock faible', message: `"${item.name}" — ${item.quantity} unité(s) restante(s)`, severity: 'warning' });
  }

  const subscription = await prisma.subscription.findFirst({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  if (subscription) {
    const endDate = new Date(subscription.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7 && daysLeft > 0 && subscription.status === 'ACTIVE') {
      notifications.push({ companyId, type: 'ABONNEMENT', title: 'Abonnement expire bientôt', message: `Votre abonnement expire dans ${daysLeft} jour(s).`, severity: 'info' });
    }
  }

  const upcomingMaintenance = await prisma.vehicle.findMany({
    where: { companyId, isActive: true, insuranceExpiry: { not: null } },
    select: { id: true, plateNumber: true, insuranceExpiry: true },
  });
  for (const v of upcomingMaintenance) {
    if (v.insuranceExpiry) {
      const daysToExpiry = Math.ceil((v.insuranceExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToExpiry <= 30 && daysToExpiry > 0) {
        notifications.push({ companyId, type: 'MAINTENANCE', title: 'Assurance véhicule', message: `"${v.plateNumber}" — assurance expire dans ${daysToExpiry} jour(s).`, severity: 'warning' });
      }
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications.map(({ severity, ...n }) => ({
      ...n,
      isRead: false,
      createdAt: new Date(),
    } as any)) });
  }
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) return res.status(400).json({ success: false, message: 'Entreprise requise' });

    generateAutoNotifications(companyId).catch(() => {});

    const [
      company,
      chantiers,
      employees,
      workers,
      stockItems,
      purchases,
      expenses,
      presences,
      invoices,
      materials,
      vehicles,
      lowStockItems,
      recentExpenses,
      purchaseByMonth,
      expenseByMonth,
      subscription,
    ] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { name: true, logo: true, slug: true, address: true, phone: true, email: true, country: true, currency: true } }),
      prisma.chantier.count({ where: { companyId } }),
      prisma.employee.count({ where: { companyId, isActive: true } }),
      prisma.worker.count({ where: { companyId, isActive: true } }),
      prisma.stockItem.count({ where: { companyId } }),
      prisma.purchase.aggregate({ where: { companyId }, _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ where: { companyId }, _sum: { amount: true } }),
      prisma.presence.count({ where: { companyId, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.invoice.aggregate({ where: { companyId }, _sum: { total: true, paidAmount: true } }),
      prisma.material.count({ where: { companyId, isActive: true } }),
      prisma.vehicle.count({ where: { companyId, isActive: true } }),
      prisma.stockItem.findMany({ where: { companyId, quantity: { lte: 2 } }, select: { id: true } }),
      prisma.expense.findMany({ where: { companyId }, orderBy: { date: 'desc' }, take: 10 }),
      prisma.purchase.groupBy({ by: ['date'], where: { companyId }, _sum: { totalAmount: true }, orderBy: { date: 'asc' } }),
      prisma.expense.groupBy({ by: ['date'], where: { companyId }, _sum: { amount: true }, orderBy: { date: 'asc' } }),
      prisma.subscription.findFirst({ where: { companyId }, orderBy: { createdAt: 'desc' } }),
    ]);

    let subscriptionInfo = null;
    if (subscription) {
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      subscriptionInfo = {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
        daysRemaining,
        isExpired: endDate < now,
      };
    }

    const monthlyPurchases = purchaseByMonth.map((p: any) => ({
      month: p.date,
      total: p._sum.totalAmount || 0,
    }));

    const monthlyExpenses = expenseByMonth.map((e: any) => ({
      month: e.date,
      total: e._sum.amount || 0,
    }));

    const totalPurchases = purchases._sum.totalAmount || 0;
    const totalExpenses = expenses._sum.amount || 0;
    const totalInvoiced = invoices._sum.total || 0;
    const totalPaid = invoices._sum.paidAmount || 0;

    res.json({
      success: true,
      data: {
        company,
        stats: {
          chantiers,
          employees,
          workers,
          stockItems,
          purchases: totalPurchases,
          expenses: totalExpenses,
          presences,
          invoiced: totalInvoiced,
          paid: totalPaid,
          benefice: totalPaid - totalExpenses - totalPurchases,
          materials,
          vehicles,
          lowStock: lowStockItems.length,
        },
        charts: {
          monthlyPurchases,
          monthlyExpenses,
        },
        recentExpenses,
        alerts: [],
        subscription: subscriptionInfo,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
