import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    companyId?: string;
    role: string;
    isSuperAdmin: boolean;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Token manquant', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      companyId?: string;
      role: string;
      isSuperAdmin: boolean;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      throw new AppError('Utilisateur introuvable ou désactivé', 401);
    }

    req.user = {
      id: decoded.id,
      companyId: decoded.companyId,
      role: decoded.role,
      isSuperAdmin: decoded.isSuperAdmin,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expiré', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token invalide', 401));
    } else {
      next(error);
    }
  }
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isSuperAdmin) {
    return next(new AppError('Accès réservé au Super Admin', 403));
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Non autorisé', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Rôle insuffisant', 403));
    }
    next();
  };
};
