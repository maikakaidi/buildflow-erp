import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Chip, Button, Stack, List, ListItem, ListItemText, Divider, Alert, useTheme, alpha } from '@mui/material';
import { Sync as SyncIcon, CloudDone, CloudOff, Pending as PendingIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import syncService from '../../api/sync';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';

const ENTITY_LABELS: Record<string, string> = {
  chantiers: 'Chantiers',
  employees: 'Employés',
  workers: 'Ouvriers',
  suppliers: 'Fournisseurs',
  clients: 'Clients',
  stockItems: 'Articles de stock',
  materials: 'Matériels',
  vehicles: 'Véhicules',
  purchases: 'Achats',
  expenses: 'Dépenses',
  presences: 'Présences',
  dailyReports: 'Journal de chantier',
  stockMovements: 'Mouvements de stock',
};

export default function SyncPage() {
  const theme = useTheme();
  const { isOnline, isSyncing, pendingItems, lastSyncAt } = useNetwork();
  const [journal, setJournal] = useState<any[]>([]);
  const [localConflicts, setLocalConflicts] = useState<any[]>([]);
  const [serverConflicts, setServerConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const j = await syncService.getSyncJournal(100);
    setJournal(j);
    const c = await syncService.getConflicts();
    setLocalConflicts(c);
    try {
      const { data } = await api.get('/sync/conflicts');
      if (data.success) setServerConflicts(data.data);
    } catch {
      setServerConflicts([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSyncNow = async () => {
    await syncService.syncAll();
    load();
  };

  const handleResolveLocal = async (entity: string, id: string) => {
    await syncService.resolveConflict(entity, id, 'local');
    await syncService.processQueue();
    load();
  };

  const handleResolveServerSide = async (entity: string, id: string) => {
    await syncService.resolveConflict(entity, id, 'server');
    load();
  };

  const handleResolveServerConflict = async (conflictId: string, resolution: 'client' | 'server') => {
    await api.post(`/sync/conflicts/${conflictId}/resolve`, { resolution });
    load();
  };

  const columns: Column<any>[] = [
    { id: 'timestamp', label: 'Date / Heure', render: (r) => new Date(r.timestamp).toLocaleString('fr-FR') },
    {
      id: 'direction', label: 'Direction',
      render: (r) => (
        <Chip size="small" label={r.direction === 'push' ? 'Envoi' : 'Réception'}
          color={r.direction === 'push' ? 'primary' : 'secondary'} variant="outlined" />
      ),
    },
    { id: 'entity', label: 'Entité', render: (r) => ENTITY_LABELS[r.entity] || r.entity },
    { id: 'itemsSent', label: 'Envoyés', align: 'right', render: (r) => r.itemsSent },
    { id: 'itemsReceived', label: 'Reçus', align: 'right', render: (r) => r.itemsReceived },
    {
      id: 'status', label: 'Statut',
      render: (r) => (
        <Chip size="small" label={r.status}
          color={r.status === 'success' ? 'success' : r.status === 'error' ? 'error' : 'warning'} />
      ),
    },
    { id: 'errors', label: 'Erreurs', render: (r) => r.errors || '—' },
  ];

  const statusCard = (icon: React.ReactNode, title: string, value: string, color: string) => (
    <Paper
      sx={{
        p: 2, flex: 1, minWidth: 180, borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <PageHeader
        title="Synchronisation"
        subtitle="Mode hors ligne : l'application enregistre localement et synchronise automatiquement"
        action={{ label: 'Synchroniser maintenant', icon: <SyncIcon />, onClick: handleSyncNow }}
        onRefresh={load}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {statusCard(
          isOnline ? <CloudDone fontSize="large" /> : <CloudOff fontSize="large" />,
          'État réseau',
          isSyncing ? 'Synchronisation...' : isOnline ? 'En ligne' : 'Hors ligne',
          isSyncing ? theme.palette.warning.main : isOnline ? theme.palette.success.main : theme.palette.error.main
        )}
        {statusCard(
          <PendingIcon fontSize="large" />,
          'Éléments en attente',
          String(pendingItems),
          theme.palette.info.main
        )}
        {statusCard(
          <CloudDone fontSize="large" />,
          'Dernière synchronisation',
          lastSyncAt ? new Date(lastSyncAt).toLocaleString('fr-FR') : 'Jamais',
          theme.palette.text.secondary
        )}
      </Stack>

      {(localConflicts.length > 0 || serverConflicts.length > 0) && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}` }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Conflits à résoudre ({localConflicts.length + serverConflicts.length})
          </Typography>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Deux versions différentes existent pour le même enregistrement. Choisissez laquelle conserver.
          </Alert>

          <List dense>
            {localConflicts.map((c: any) => (
              <ListItem
                key={`local-${c._entity}-${c.id}`}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" color="primary"
                      onClick={() => handleResolveLocal(c._entity, c.id)}>
                      Garder local
                    </Button>
                    <Button size="small" variant="outlined"
                      onClick={() => handleResolveServerSide(c._entity, c.id)}>
                      Garder serveur
                    </Button>
                  </Stack>
                }
              >
                <ListItemText
                  primary={`${ENTITY_LABELS[c._entity] || c._entity} — ${c.name || c.firstName || c.code || c.reference || c.id}`}
                  secondary={`Version locale en attente d'envoi (${new Date(c.updatedAt).toLocaleString('fr-FR')})`}
                />
              </ListItem>
            ))}
            {serverConflicts.map((c: any) => (
              <ListItem
                key={`server-${c.id}`}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" color="primary"
                      onClick={() => handleResolveServerConflict(c.id, 'client')}>
                      Garder local
                    </Button>
                    <Button size="small" variant="outlined"
                      onClick={() => handleResolveServerConflict(c.id, 'server')}>
                      Garder serveur
                    </Button>
                  </Stack>
                }
              >
                <ListItemText
                  primary={`${ENTITY_LABELS[c.entity] || c.entity} — ${c.entityId}`}
                  secondary={`Conflit détecté serveur (${new Date(c.createdAt).toLocaleString('fr-FR')})`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Paper sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}` }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Journal des synchronisations
        </Typography>
        <DataTable
          columns={columns}
          data={journal}
          loading={loading}
          enableCsvExport={false}
          emptyMessage="Aucune synchronisation enregistrée pour le moment"
        />
      </Paper>
    </Box>
  );
}
