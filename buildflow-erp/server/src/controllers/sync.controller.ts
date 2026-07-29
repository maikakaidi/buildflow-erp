import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import logger from '../config/logger';

const SYNC_ENTITIES = [
  'chantiers',
  'employees',
  'workers',
  'suppliers',
  'clients',
  'stockItems',
  'stockFamilies',
  'materials',
  'vehicles',
  'purchases',
  'expenses',
  'presences',
  'salaries',
  'dailyReports',
  'locations',
  'contracts',
  'documents',
] as const;

type SyncEntity = typeof SYNC_ENTITIES[number];

const ENTITY_MODELS: Record<string, any> = {
  chantiers: () => prisma.chantier,
  employees: () => prisma.employee,
  workers: () => prisma.worker,
  suppliers: () => prisma.supplier,
  clients: () => prisma.client,
  stockItems: () => prisma.stockItem,
  stockFamilies: () => prisma.stockFamily,
  materials: () => prisma.material,
  vehicles: () => prisma.vehicle,
  purchases: () => prisma.purchase,
  expenses: () => prisma.expense,
  presences: () => prisma.presence,
  salaries: () => prisma.salary,
  dailyReports: () => prisma.dailyReport,
  locations: () => prisma.location,
  contracts: () => prisma.contract,
  documents: () => prisma.document,
};

export class SyncController {
  static async push(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.json({ success: true, data: { created: 0, updated: 0, conflicts: 0, results: [] } });
      }

      const { entity, items } = req.body;

      if (!SYNC_ENTITIES.includes(entity)) {
        throw new AppError(`Entité inconnue: ${entity}`, 400);
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError('Items requis', 400);
      }

      const results = [];
      let conflicts = 0;
      let created = 0;
      let updated = 0;

      for (const item of items) {
        try {
          const model = ENTITY_MODELS[entity]();

          if (item.serverId) {
            const existing = await model.findFirst({
              where: { id: item.serverId, companyId },
            });

            if (existing) {
              if (existing.updatedAt > new Date(item.updatedAt)) {
                conflicts++;
                await prisma.syncConflict.create({
                  data: {
                    companyId,
                    entity,
                    entityId: item.serverId,
                    localData: item,
                    serverData: existing,
                    resolution: 'pending',
                  },
                });
                results.push({ id: item.localId, status: 'conflict' });
                continue;
              }

              const { localId, serverId, ...updateData } = item;
              await model.update({
                where: { id: item.serverId },
                data: { ...updateData, updatedAt: new Date() },
              });
              updated++;
              results.push({ id: item.serverId, status: 'updated' });
            } else {
              const { localId, serverId, ...createData } = item;
              const created_item = await model.create({
                data: { ...createData, companyId, id: item.serverId },
              });
              created++;
              results.push({ id: created_item.id, status: 'created', localId: item.localId });
            }
          } else {
            const { localId, ...createData } = item;
            const created_item = await model.create({
              data: { ...createData, companyId },
            });
            created++;
            results.push({ id: created_item.id, status: 'created', localId: item.localId });
          }
        } catch (err: any) {
          results.push({ id: item.localId || item.serverId, status: 'error', error: err.message });
        }
      }

      await prisma.syncLog.create({
        data: {
          companyId,
          userId: req.user!.id,
          direction: 'push',
          entity,
          itemsSent: items.length,
          status: conflicts > 0 ? 'partial' : 'success',
        },
      });

      logger.info(`Sync push: ${entity} - ${created} créés, ${updated} mis à jour, ${conflicts} conflits`);

      res.json({
        success: true,
        data: {
          created,
          updated,
          conflicts,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async pull(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.json({ success: true, data: { entity: req.query.entity, items: [], serverTime: new Date().toISOString() } });
      }

      const { entity, since } = req.query;

      if (!entity || !(SYNC_ENTITIES as readonly string[]).includes(entity as string)) {
        throw new AppError('Entité requise et valide', 400);
      }

      const model = ENTITY_MODELS[entity as string]();
      const sinceDate = since ? new Date(since as string) : new Date(0);

      const items = await model.findMany({
        where: {
          companyId,
          updatedAt: { gt: sinceDate },
        },
        orderBy: { updatedAt: 'asc' },
      });

      await prisma.syncLog.create({
        data: {
          companyId,
          userId: req.user!.id,
          direction: 'pull',
          entity: entity as string,
          itemsReceived: items.length,
          status: 'success',
        },
      });

      res.json({
        success: true,
        data: {
          entity,
          items,
          serverTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async pullAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.json({ success: true, data: { entities: {}, serverTime: new Date().toISOString() } });
      }

      const { since } = req.query;
      const sinceDate = since ? new Date(since as string) : new Date(0);

      const data: Record<string, any[]> = {};

      for (const entity of SYNC_ENTITIES) {
        const model = ENTITY_MODELS[entity]();
        data[entity] = await model.findMany({
          where: {
            companyId,
            updatedAt: { gt: sinceDate },
          },
          orderBy: { updatedAt: 'asc' },
        });
      }

      res.json({
        success: true,
        data: {
          entities: data,
          serverTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getConflicts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.json({ success: true, data: [] });
      }

      const conflicts = await prisma.syncConflict.findMany({
        where: { companyId, resolution: 'pending' },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: conflicts });
    } catch (error) {
      next(error);
    }
  }

  static async resolveConflict(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.json({ success: true, message: 'Aucun conflit' });
      }

      const { id } = req.params;
      const { resolution } = req.body;

      if (!['server', 'client', 'merge'].includes(resolution)) {
        throw new AppError('Résolution invalide', 400);
      }

      const conflict = await prisma.syncConflict.findFirst({
        where: { id, companyId },
      });

      if (!conflict) throw new AppError('Conflit introuvable', 404);

      const model = ENTITY_MODELS[conflict.entity];
      if (model && conflict.entityId) {
        if (resolution === 'server') {
          await model().update({
            where: { id: conflict.entityId },
            data: conflict.serverData as any,
          });
        } else if (resolution === 'client') {
          const { localId, serverId, ...data } = conflict.localData as any;
          await model().update({
            where: { id: conflict.entityId },
            data,
          });
        }
      }

      await prisma.syncConflict.update({
        where: { id },
        data: {
          resolution,
          resolvedAt: new Date(),
          resolvedBy: req.user!.id,
        },
      });

      res.json({ success: true, message: 'Conflit résolu' });
    } catch (error) {
      next(error);
    }
  }

  static async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      if (!companyId) {
        return res.json({ success: true, data: { logs: [], total: 0, page: 1, pages: 0 } });
      }

      const { page = '1', limit = '50' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [logs, total] = await Promise.all([
        prisma.syncLog.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.syncLog.count({ where: { companyId } }),
      ]);

      res.json({
        success: true,
        data: { logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      });
    } catch (error) {
      next(error);
    }
  }
}
