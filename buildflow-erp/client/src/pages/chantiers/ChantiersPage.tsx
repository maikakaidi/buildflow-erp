import React, { useEffect, useState } from 'react';
import { Box, Chip, LinearProgress, Typography } from '@mui/material';
import { Construction } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useOfflineData } from '../../hooks/useOfflineData';
import { useNetwork } from '../../hooks/useNetwork';

const TYPE_OPTIONS = [
  { value: 'VILLA', label: 'Villa' },
  { value: 'ROUTE', label: 'Route' },
  { value: 'PONT', label: 'Pont' },
  { value: 'MUR', label: 'Mur' },
  { value: 'VOIRIE', label: 'Voirie' },
  { value: 'CASERNE', label: 'Caserne' },
  { value: 'CAMP_MILITAIRE', label: 'Camp militaire' },
  { value: 'BATIMENT_ADMINISTRATIF', label: 'Bâtiment administratif' },
  { value: 'REHABILITATION', label: 'Réhabilitation' },
  { value: 'GENIE_CIVIL', label: 'Génie Civil' },
];

const STATUS_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'EN_PAUSE', label: 'En pause' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

const formFields: FormField[] = [
  { name: 'name', label: 'Nom du chantier', required: true, gridSize: 12 },
  { name: 'code', label: 'Code', gridSize: 4 },
  { name: 'type', label: 'Type', type: 'select', options: TYPE_OPTIONS, required: true, gridSize: 4 },
  { name: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS, defaultValue: 'EN_ATTENTE', gridSize: 4 },
  { name: 'responsable', label: 'Responsable', gridSize: 6 },
  { name: 'budget', label: 'Budget (FCFA)', type: 'number', gridSize: 6 },
  { name: 'address', label: 'Adresse', gridSize: 12 },
  { name: 'startDate', label: 'Date début', type: 'date', gridSize: 6 },
  { name: 'endDate', label: 'Date fin', type: 'date', gridSize: 6 },
  { name: 'description', label: 'Description', type: 'textarea', gridSize: 12 },
];

export default function ChantiersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();
  const offlineData = useOfflineData('chantiers');

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/chantiers', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch {
      if (!isOnline) {
        await offlineData.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) {
        if (isOnline) {
          await api.put(`/modules/chantiers/${editItem.id}`, formData);
        } else {
          await offlineData.update(editItem.id, formData);
        }
      } else {
        if (isOnline) {
          await api.post('/modules/chantiers', formData);
        } else {
          await offlineData.add(formData);
        }
      }
      setDialogOpen(false);
      setEditItem(null);
      loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    try {
      if (isOnline) {
        await api.delete(`/modules/chantiers/${row.id}`);
      } else {
        await offlineData.remove(row.id);
      }
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const columns: Column<any>[] = [
    {
      id: 'name', label: 'Nom', sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
          {row.code && <Typography variant="caption" color="text.secondary">{row.code}</Typography>}
        </Box>
      ),
    },
    { id: 'type', label: 'Type', render: (row) => TYPE_OPTIONS.find((t) => t.value === row.type)?.label || row.type },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
    { id: 'responsable', label: 'Responsable', render: (row) => row.responsable || '—' },
    {
      id: 'budget', label: 'Budget', align: 'right',
      render: (row) => new Intl.NumberFormat('fr-FR').format(row.budget) + ' FCFA',
    },
    {
      id: 'progress', label: 'Progression', align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress variant="determinate" value={row.progress || 0} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
          <Typography variant="caption" fontWeight={600}>{row.progress || 0}%</Typography>
        </Box>
      ),
    },
    {
      id: '_syncStatus', label: 'Sync', align: 'center',
      render: (row) => row._syncStatus ? <StatusChip status={row._syncStatus} /> : null,
    },
  ];

  const displayData = isOnline ? data : (offlineData.data.length > 0 ? offlineData.data : data);

  return (
    <Box>
      <PageHeader
        title="Chantiers"
        subtitle={`${displayData.length} chantier(s)`}
        action={{ label: 'Nouveau chantier', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />

      <DataTable
        columns={columns}
        data={displayData}
        loading={loading}
        searchFields={['name', 'code', 'responsable', 'type']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }}
        onDelete={handleDelete}
      />

      <FormDialog
        open={dialogOpen}
        title={editItem ? 'Modifier le chantier' : 'Nouveau chantier'}
        fields={formFields}
        values={editItem}
        loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
