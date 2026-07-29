import { db, generateLocalId } from '../database/schema';
import api from './client';

type EntityType =
  | 'chantiers' | 'employees' | 'workers' | 'suppliers' | 'clients'
  | 'stockItems' | 'materials' | 'vehicles' | 'purchases' | 'expenses'
  | 'presences' | 'dailyReports';

const ENTITY_ENDPOINT_MAP: Record<EntityType, string> = {
  chantiers: 'chantiers',
  employees: 'employees',
  workers: 'workers',
  suppliers: 'suppliers',
  clients: 'clients',
  stockItems: 'stock-items',
  materials: 'materials',
  vehicles: 'vehicles',
  purchases: 'purchases',
  expenses: 'expenses',
  presences: 'presences',
  dailyReports: 'daily-reports',
};

class SyncService {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());
  }

  onStatusChange(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private onOnline() {
    this.syncAll();
  }

  private onOffline() {
    this.stopSync();
  }

  startAutoSync(intervalMs: number = 30000) {
    this.stopSync();
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, intervalMs);

    if (navigator.onLine) {
      this.syncAll();
    }
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async addToQueue(entity: EntityType, action: 'create' | 'update' | 'delete', data: any, serverId?: string) {
    const localId = data._localId || generateLocalId();

    const item = {
      entity,
      action,
      localId,
      serverId,
      data: { ...data, _localId: localId },
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending' as const,
    };

    await db.syncQueue.add(item);

    const table = (db as any)[entity] as any;
    if (table && action !== 'delete') {
      const existing = await table.get(data.id || localId);
      if (existing) {
        await table.update(data.id || localId, { _syncStatus: 'pending', updatedAt: new Date().toISOString() });
      } else {
        await table.add({ ...data, id: localId, _localId: localId, _syncStatus: 'pending', updatedAt: new Date().toISOString() });
      }
    }

    this.notify();

    if (navigator.onLine) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    this.notify();

    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .limit(50)
        .toArray();

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.notify();
        return;
      }

      const grouped: Record<string, any[]> = {};
      for (const item of pendingItems) {
        if (!grouped[item.entity]) grouped[item.entity] = [];
        grouped[item.entity].push(item);
      }

      for (const [entity, items] of Object.entries(grouped)) {
        try {
          const syncItems = items.map((i) => ({
            ...i.data,
            localId: i.localId,
            serverId: i.serverId,
          }));

          const response = await api.post('/sync/push', { entity, items: syncItems });

          const results = response.data.data.results;
          for (let i = 0; i < items.length; i++) {
            const result = results[i];
            const queueItem = items[i];

            if (result.status === 'created' || result.status === 'updated') {
              const table = (db as any)[entity] as any;
              if (table && result.id) {
                await db.syncQueue.delete(queueItem.id!);
                const localRecord = await table.get(queueItem.localId);
                if (localRecord) {
                  await table.delete(queueItem.localId);
                  await table.add({
                    ...localRecord,
                    id: result.id,
                    serverId: result.id,
                    _syncStatus: 'synced',
                    updatedAt: new Date().toISOString(),
                  });
                }
              } else {
                await db.syncQueue.delete(queueItem.id!);
              }
            } else if (result.status === 'conflict') {
              await db.syncQueue.update(queueItem.id!, { status: 'failed', retries: queueItem.retries + 1 });
              const table = (db as any)[entity] as any;
              if (table) {
                await table.update(queueItem.localId, { _syncStatus: 'conflict' });
              }
            } else {
              await db.syncQueue.update(queueItem.id!, { retries: queueItem.retries + 1 });
            }
          }

          await db.syncJournal.add({
            timestamp: new Date().toISOString(),
            direction: 'push',
            entity,
            itemsSent: items.length,
            itemsReceived: 0,
            status: 'success',
          });
        } catch (error: any) {
          await db.syncJournal.add({
            timestamp: new Date().toISOString(),
            direction: 'push',
            entity,
            itemsSent: items.length,
            itemsReceived: 0,
            status: 'error',
            errors: error.message,
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  async syncAll() {
    if (!navigator.onLine || this.isSyncing) return;

    this.isSyncing = true;
    this.notify();

    try {
      const lastSync = localStorage.getItem('lastSyncAt');
      const response = await api.get('/sync/pull-all', { since: lastSync });
      const entities = response.data.data.entities;

      for (const [entity, serverItems] of Object.entries(entities)) {
        const table = (db as any)[entity] as any;
        if (!table || !Array.isArray(serverItems)) continue;

        for (const item of serverItems) {
          const existing = await table.get(item.id);
          if (existing && existing._syncStatus === 'pending') {
            if (new Date(item.updatedAt) > new Date(existing.updatedAt)) {
              await table.update(item.id, {
                ...item,
                _syncStatus: 'synced',
                _serverId: item.id,
              });
            }
          } else {
            await table.put({
              ...item,
              _localId: item.id,
              _syncStatus: 'synced',
            });
          }
        }
      }

      localStorage.setItem('lastSyncAt', new Date().toISOString());

      await db.syncJournal.add({
        timestamp: new Date().toISOString(),
        direction: 'pull',
        entity: 'all',
        itemsSent: 0,
        itemsReceived: Object.values(entities).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0),
        status: 'success',
      });
    } catch (error: any) {
      await db.syncJournal.add({
        timestamp: new Date().toISOString(),
        direction: 'pull',
        entity: 'all',
        itemsSent: 0,
        itemsReceived: 0,
        status: 'error',
        errors: error.message,
      });
    } finally {
      this.isSyncing = false;
      this.notify();
      await this.processQueue();
    }
  }

  async getPendingCount(): Promise<number> {
    return db.syncQueue.where('status').equals('pending').count();
  }

  async getSyncJournal(limit: number = 50) {
    return db.syncJournal.orderBy('timestamp').reverse().limit(limit).toArray();
  }

  async getConflicts() {
    const conflicts: any[] = [];
    const tables = ['chantiers', 'employees', 'workers', 'stockItems', 'purchases', 'expenses', 'presences'];

    for (const entity of tables) {
      const table = (db as any)[entity] as any;
      if (table) {
        const items = await table.where('_syncStatus').equals('conflict').toArray();
        conflicts.push(...items.map((i: any) => ({ ...i, _entity: entity })));
      }
    }

    return conflicts;
  }

  async resolveConflict(entity: string, localId: string, resolution: 'local' | 'server') {
    const table = (db as any)[entity] as any;
    if (!table) return;

    if (resolution === 'server') {
      const item = await table.get(localId);
      if (item?.serverId) {
        const response = await api.get(`/modules/${ENTITY_ENDPOINT_MAP[entity as EntityType] || entity}/${item.serverId}`);
        await table.update(localId, {
          ...response.data.data,
          _syncStatus: 'synced',
        });
      }
    } else {
      await table.update(localId, { _syncStatus: 'pending' });
      await this.addToQueue(entity as EntityType, 'update', await table.get(localId), undefined);
    }
  }
}

export const syncService = new SyncService();
export default syncService;
