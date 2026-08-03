import { useState, useEffect, useCallback } from 'react';
import { db } from '../database/schema';
import { useAuth } from '../context/AuthContext';

type TableName = keyof Omit<typeof db, 'syncQueue' | 'syncJournal' | 'photoUploads'>;

export function useOfflineData<T extends { id: string }>(
  tableName: TableName,
  filters?: Record<string, any>
) {
  const { user } = useAuth();
  const companyId = user?.companyId || '';
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const table = db[tableName] as any;

      if (filters) {
        let results = await table.toArray();
        if (companyId) results = results.filter((item: any) => item.companyId === companyId);
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            results = results.filter((item: any) => item[key] === value);
          }
        }
        setData(results);
      } else {
        let results = await table.toArray();
        if (companyId) results = results.filter((item: any) => item.companyId === companyId);
        setData(results);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName, companyId, JSON.stringify(filters)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const add = useCallback(
    async (item: Partial<T>) => {
      const table = db[tableName] as any;
      const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const record = {
        ...item,
        id,
        companyId,
        _localId: id,
        _syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await table.add(record);
      await loadData();

      const { default: syncService } = await import('../api/sync');
      syncService.addToQueue(tableName as any, 'create', record, undefined, companyId);

      return record;
    },
    [tableName, companyId, loadData]
  );

  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      const table = db[tableName] as any;
      const current = await table.get(id);
      const record = {
        ...updates,
        companyId: current?.companyId || companyId,
        _syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };

      await table.update(id, record);
      await loadData();

      const { default: syncService } = await import('../api/sync');
      syncService.addToQueue(tableName as any, 'update', { ...record, id, serverId: current?.serverId }, current?.serverId, companyId);
    },
    [tableName, companyId, loadData]
  );

  const remove = useCallback(
    async (id: string) => {
      const table = db[tableName] as any;
      const item = await table.get(id);
      await table.delete(id);
      await loadData();

      if (item?.serverId || item?._serverId || item?.id) {
        const { default: syncService } = await import('../api/sync');
        syncService.addToQueue(tableName as any, 'delete', { id: item.serverId || item._serverId || item.id }, item.serverId || item._serverId || item.id, companyId);
      }
    },
    [tableName, companyId, loadData]
  );

  const getById = useCallback(
    async (id: string) => {
      const table = db[tableName] as any;
      return table.get(id);
    },
    [tableName]
  );

  return { data, loading, error, add, update, remove, getById, refresh: loadData };
}
