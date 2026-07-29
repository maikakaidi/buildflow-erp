import React from 'react';
import { useTheme, Box, Chip, Tooltip, Typography } from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Sync as SyncIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNetwork } from '../../hooks/useNetwork';
import { useAuth } from '../../context/AuthContext';

export default function NetworkIndicator() {
  const theme = useTheme();
  const { isOnline, isSyncing, pendingItems, lastSyncAt } = useNetwork();
  const { user } = useAuth();

  if (user?.isSuperAdmin) return null;

  const getStatus = () => {
    if (isSyncing) return { label: 'Synchronisation...', color: 'warning' as const, icon: <SyncIcon /> };
    if (!isOnline) return { label: 'Hors ligne', color: 'error' as const, icon: <WifiOffIcon /> };
    if (pendingItems > 0) return { label: `${pendingItems} en attente`, color: 'info' as const, icon: <HistoryIcon /> };
    return { label: 'En ligne', color: 'success' as const, icon: <WifiIcon /> };
  };

  const status = getStatus();

  const tooltipText = [
    `État: ${isOnline ? 'En ligne' : 'Hors ligne'}`,
    isSyncing ? 'Synchronisation en cours...' : '',
    pendingItems > 0 ? `${pendingItems} éléments en attente de sync` : '',
    lastSyncAt ? `Dernière sync: ${new Date(lastSyncAt).toLocaleString('fr-FR')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <Tooltip title={tooltipText} arrow>
      <Chip
        icon={status.icon}
        label={status.label}
        color={status.color as any}
        variant="outlined"
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 28,
          transition: 'all 0.3s ease',
          '& .MuiChip-icon': {
            fontSize: 16,
            animation: isSyncing ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          },
        }}
      />
    </Tooltip>
  );
}
