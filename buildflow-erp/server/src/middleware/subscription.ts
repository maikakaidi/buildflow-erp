import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';
import { AppError } from '../utils/AppError';

export const checkSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.isSuperAdmin) return next();
    if (!req.user?.companyId) return next();

    const subscription = await prisma.subscription.findFirst({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return next(new AppError('Aucun hébergement trouvé', 403));
    }

    if (subscription.status === 'SUSPENDED') {
      return next(new AppError('ABONNEMENT_SUSPENDU', 403));
    }

    if (subscription.status === 'EXPIRED' || subscription.endDate < new Date()) {
      if (subscription.status !== 'EXPIRED') {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });
      }
      return next(new AppError('ABONNEMENT_EXPIRE', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};
