import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { EventNote } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';
import { useOfflineData } from '../../hooks/useOfflineData';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Présent' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'RETARD', label: 'Retard' },
  { value: 'CONGE', label: 'Congé' },
];

const formFields: FormField[] = [
  { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0], gridSize: 6 },
  { name: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS, required: true, defaultValue: 'PRESENT', gridSize: 6 },
  { name: 'checkIn', label: 'Heure d\'arrivée', gridSize: 6 },
  { name: 'checkOut', label: 'Heure de départ', gridSize: 6 },
  { name: 'hoursWorked', label: 'Heures travaillées', type: 'number', gridSize: 6 },
  { name: 'overtime', label: 'Heures supplémentaires', type: 'number', defaultValue: 0, gridSize: 6 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function PresencesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();
  const offlineData = useOfflineData('presences');

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/presences', { limit: 500 });
      if (res.success) setData(res.data.items);
    } catch { await offlineData.refresh(); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) {
        if (isOnline) await api.put(`/modules/presences/${editItem.id}`, formData);
        else await offlineData.update(editItem.id, formData);
      } else {
        if (isOnline) await api.post('/modules/presences', formData);
        else await offlineData.add(formData);
      }
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try {
      if (isOnline) await api.delete(`/modules/presences/${row.id}`);
      else await offlineData.remove(row.id);
      loadData();
    } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    { id: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString('fr-FR'), sortable: true },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
    { id: 'checkIn', label: 'Arrivée', render: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { id: 'checkOut', label: 'Départ', render: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { id: 'hoursWorked', label: 'Heures', align: 'center', render: (row) => row.hoursWorked || '—' },
    { id: 'overtime', label: 'Suppl.', align: 'center', render: (row) => row.overtime > 0 ? `+${row.overtime}h` : '—' },
    { id: 'notes', label: 'Notes', render: (row) => <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{row.notes || '—'}</Typography> },
  ];

  const displayData = isOnline ? data : (offlineData.data.length > 0 ? offlineData.data : data);

  return (
    <Box>
      <PageHeader title="Présences" subtitle={`${displayData.length} pointage(s)`}
        action={{ label: 'Nouveau pointage', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={displayData} loading={loading}
        searchFields={['status', 'notes']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le pointage' : 'Nouveau pointage'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
