import { Request, Response, NextFunction, Router } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';

const KNOWN_RELATIONS = new Set([
  'company', 'user', 'chantier', 'supplier', 'client', 'employee', 'worker',
  'vehicle', 'invoice', 'family', 'item', 'items', 'contracts', 'presences',
  'salaries', 'dailyReports', 'documents', 'expenses', 'purchases', 'locations',
  'payments', 'users', 'stockItems', 'stockFamilies', 'materials', 'vehicles',
  'movements', 'refreshTokens', 'auditLogs', 'subscriptions', 'notifications',
  'paymentInfo', 'settings', 'companies',
]);

const SCALAR_SKIP = new Set(['id', 'createdAt', 'updatedAt']);

const rm = (prisma as any)._runtimeDataModel;
const delegateToModel = new Map<any, string>();
const MODEL_NUMERIC: Record<string, Set<string>> = {};
const MODEL_DATES: Record<string, Set<string>> = {};

for (const [name, model] of Object.entries(rm.models as Record<string, any>)) {
  const numeric = new Set<string>();
  const dates = new Set<string>();
  for (const field of model.fields) {
    if (field.kind === 'scalar') {
      if (field.type === 'Int' || field.type === 'Float') numeric.add(field.name);
      if (field.type === 'DateTime') dates.add(field.name);
    }
  }
  MODEL_NUMERIC[name] = numeric;
  MODEL_DATES[name] = dates;
  const key = name.charAt(0).toLowerCase() + name.slice(1);
  if ((prisma as any)[key]) {
    delegateToModel.set((prisma as any)[key], name);
  }
}

export class ModuleController {
  private entity: string;
  private model: any;
  private include?: any;
  private modelName: string;

  constructor(entity: string, model: any, include?: any) {
    this.entity = entity;
    this.model = model;
    this.include = include;
    this.modelName = delegateToModel.get(model) || '';
  }

  private filterData(body: any): any {
    const numericFields = MODEL_NUMERIC[this.modelName];
    const dateFields = MODEL_DATES[this.modelName];
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (SCALAR_SKIP.has(key)) continue;
      if (KNOWN_RELATIONS.has(key)) continue;
      if (value === '' || value === undefined) continue;
      if (value === null) { result[key] = null; continue; }

      if (typeof value === 'string') {
        if (numericFields?.has(key)) {
          const n = Number(value);
          if (!isNaN(n)) { result[key] = n; continue; }
          continue;
        }
        if (dateFields?.has(key)) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) { result[key] = d; continue; }
          continue;
        }
      }

      result[key] = value;
    }
    return result;
  }

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const { page = '1', limit = '50', search, status, sort = 'createdAt', order = 'desc' } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { companyId };

      if (search) {
        const searchFields = ['name', 'firstName', 'lastName', 'code', 'description', 'reference', 'title'];
        where.OR = searchFields.map((f) => ({ [f]: { contains: search, mode: 'insensitive' } }));
      }
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        this.model.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sort as string]: order },
          ...(this.include ? { include: this.include } : {}),
        }),
        this.model.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          items,
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const item = await this.model.findFirst({
        where: { id, companyId },
        ...(this.include ? { include: this.include } : {}),
      });

      if (!item) throw new AppError(`${this.entity} introuvable`, 404);

      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) throw new AppError('Entreprise requise', 400);

      const filtered = this.filterData(req.body);
      const item = await this.model.create({
        data: { ...filtered, companyId },
        ...(this.include ? { include: this.include } : {}),
      });

      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const existing = await this.model.findFirst({ where: { id, companyId } });
      if (!existing) throw new AppError(`${this.entity} introuvable`, 404);

      const filtered = this.filterData(req.body);
      const item = await this.model.update({
        where: { id },
        data: { ...filtered, updatedAt: new Date() },
        ...(this.include ? { include: this.include } : {}),
      });

      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const existing = await this.model.findFirst({ where: { id, companyId } });
      if (!existing) throw new AppError(`${this.entity} introuvable`, 404);

      await this.model.delete({ where: { id } });

      res.json({ success: true, message: `${this.entity} supprimé` });
    } catch (error) {
      next(error);
    }
  };
}

export function createCrudRoutes(model: any, include?: any) {
  const entity = model.name || 'item';
  const controller = new ModuleController(entity, model, include);
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
