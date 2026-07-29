import { useState, useEffect, useCallback } from 'react';
import { db } from '../database/schema';
import syncService from '../api/sync';

interface NetworkState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncAt: string | null;
}

export function useNetwork() {
  const [state, setState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingItems: 0,
    lastSyncAt: localStorage.getItem('lastSyncAt'),
  });

  const updatePendingCount = useCallback(async () => {
    const count = await syncService.getPendingCount();
    setState((prev) => ({ ...prev, pendingItems: count }));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      syncService.syncAll();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsub = syncService.onStatusChange(() => {
      updatePendingCount();
      setState((prev) => ({
        ...prev,
        isSyncing: (syncService as any).isSyncing,
        lastSyncAt: localStorage.getItem('lastSyncAt'),
      }));
    });

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
      clearInterval(interval);
    };
  }, [updatePendingCount]);

  return state;
}
