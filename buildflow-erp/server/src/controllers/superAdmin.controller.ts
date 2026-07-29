import { Request, Response, NextFunction } from 'express';
import { SuperAdminService } from '../services/superAdmin.service';
import { AuthRequest } from '../middleware/auth';
import { createCompanySchema } from '../utils/validations';

export class SuperAdminController {
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await SuperAdminService.getDashboard();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createCompanySchema.parse(req.body);
      const result = await SuperAdminService.createCompany(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await SuperAdminService.updateCompany(id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await SuperAdminService.deleteCompany(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async suspendCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await SuperAdminService.suspendCompany(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async reactivateCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await SuperAdminService.reactivateCompany(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async renewSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { days } = req.body;
      const result = await SuperAdminService.renewSubscription(id, days);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async addFreeDays(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { days } = req.body;
      const result = await SuperAdminService.addFreeDays(id, days);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await SuperAdminService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await SuperAdminService.createUser(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await SuperAdminService.resetPassword(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payments = await SuperAdminService.getPayments();
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  static async updatePaymentInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await SuperAdminService.updatePaymentInfo(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await SuperAdminService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
