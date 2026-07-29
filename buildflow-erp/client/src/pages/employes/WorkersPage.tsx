import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { Engineering } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';
import { useOfflineData } from '../../hooks/useOfflineData';

const formFields: FormField[] = [
  { name: 'firstName', label: 'Prénom', required: true, gridSize: 6 },
  { name: 'lastName', label: 'Nom', required: true, gridSize: 6 },
  { name: 'phone', label: 'Téléphone', gridSize: 9 },
  { name: 'phoneCode', label: 'Indicatif', defaultValue: '+227', gridSize: 3 },
  { name: 'specialty', label: 'Spécialité', gridSize: 6 },
  { name: 'dailyRate', label: 'Tarif journalier (FCFA)', type: 'number', gridSize: 6 },
  { name: 'address', label: 'Adresse', gridSize: 12 },
];

export default function WorkersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();
  const offlineData = useOfflineData('workers');

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/workers', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch { await offlineData.refresh(); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) {
        if (isOnline) await api.put(`/modules/workers/${editItem.id}`, formData);
        else await offlineData.update(editItem.id, formData);
      } else {
        if (isOnline) await api.post('/modules/workers', formData);
        else await offlineData.add(formData);
      }
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try {
      if (isOnline) await api.delete(`/modules/workers/${row.id}`);
      else await offlineData.remove(row.id);
      loadData();
    } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    {
      id: 'name', label: 'Nom', sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: 'secondary.dark' }}>
            {row.firstName?.charAt(0)}{row.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.firstName} {row.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{row.phoneCode} {row.phone}</Typography>
          </Box>
        </Box>
      ),
    },
    { id: 'specialty', label: 'Spécialité', render: (row) => row.specialty || '—' },
    { id: 'dailyRate', label: 'Tarif/jour', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.dailyRate) + ' FCFA' },
    { id: 'isActive', label: 'Statut', render: (row) => <StatusChip status={row.isActive ? 'active' : 'inactive'} /> },
  ];

  const displayData = isOnline ? data : (offlineData.data.length > 0 ? offlineData.data : data);

  return (
    <Box>
      <PageHeader
        title="Ouvriers"
        subtitle={`${displayData.length} ouvrier(s)`}
        action={{ label: 'Nouvel ouvrier', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={displayData} loading={loading}
        searchFields={['firstName', 'lastName', 'specialty']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier l\'ouvrier' : 'Nouvel ouvrier'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
