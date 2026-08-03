import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../utils/validations';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token requis' });
      }
      const result = await AuthService.refreshAccessToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(req.user!.id, refreshToken);
      res.json({ success: true, message: 'Déconnexion réussie' });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await AuthService.logoutAll(req.user!.id);
      res.json({ success: true, message: 'Toutes les sessions ont été déconnectées' });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await require('../config/database').default.user.findUnique({
        where: { id: req.user!.id },
        include: { company: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
      }

      const { password, ...userWithoutPassword } = user as any;

      res.json({
        success: true,
        data: {
          user: {
            id: userWithoutPassword.id,
            firstName: userWithoutPassword.firstName,
            lastName: userWithoutPassword.lastName,
            email: userWithoutPassword.email,
            phone: userWithoutPassword.phone,
            phoneCode: userWithoutPassword.phoneCode,
            role: userWithoutPassword.role,
            isSuperAdmin: userWithoutPassword.isSuperAdmin,
            avatar: userWithoutPassword.avatar,
            companyId: userWithoutPassword.companyId,
          },
          company: userWithoutPassword.company
            ? {
                id: userWithoutPassword.company.id,
                name: userWithoutPassword.company.name,
                slug: userWithoutPassword.company.slug,
                logo: userWithoutPassword.company.logo,
                primaryColor: userWithoutPassword.company.primaryColor,
                secondaryColor: userWithoutPassword.company.secondaryColor,
                currency: userWithoutPassword.company.currency,
                language: userWithoutPassword.company.language,
                timezone: userWithoutPassword.company.timezone,
                maxUsers: userWithoutPassword.company.maxUsers,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
