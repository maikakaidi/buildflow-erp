import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export const multiTenant = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.user?.isSuperAdmin) {
      return next();
    }

    if (!req.user?.companyId) {
      return next(new AppError('Aucune entreprise associée', 403));
    }

    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });

    if (!company) {
      return next(new AppError('Entreprise introuvable', 404));
    }

    req.companyId = req.user.companyId;
    next();
  } catch (error) {
    next(error);
  }
};
