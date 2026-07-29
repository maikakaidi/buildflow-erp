import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';
import { useOfflineData } from '../../hooks/useOfflineData';

const formFields: FormField[] = [
  { name: 'name', label: 'Nom du client', required: true, gridSize: 12 },
  { name: 'contactName', label: 'Personne de contact', gridSize: 6 },
  { name: 'phone', label: 'Téléphone', required: true, gridSize: 6 },
  { name: 'phoneCode', label: 'Indicatif', defaultValue: '+227', gridSize: 3 },
  { name: 'email', label: 'Email', type: 'email', gridSize: 6 },
  { name: 'address', label: 'Adresse', gridSize: 6 },
  { name: 'type', label: 'Type', gridSize: 12 },
];

export default function ClientsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();
  const offlineData = useOfflineData('clients');

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/clients', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch { await offlineData.refresh(); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) {
        if (isOnline) await api.put(`/modules/clients/${editItem.id}`, formData);
        else await offlineData.update(editItem.id, formData);
      } else {
        if (isOnline) await api.post('/modules/clients', formData);
        else await offlineData.add(formData);
      }
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try {
      if (isOnline) await api.delete(`/modules/clients/${row.id}`);
      else await offlineData.remove(row.id);
      loadData();
    } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    {
      id: 'name', label: 'Nom', sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: 'success.dark' }}>
            {row.name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
            {row.contactName && <Typography variant="caption" color="text.secondary">{row.contactName}</Typography>}
          </Box>
        </Box>
      ),
    },
    { id: 'type', label: 'Type', render: (row) => row.type || '—' },
    { id: 'phone', label: 'Téléphone', render: (row) => `${row.phoneCode} ${row.phone}` },
    { id: 'email', label: 'Email', render: (row) => row.email || '—' },
    { id: 'isActive', label: 'Statut', render: (row) => <StatusChip status={row.isActive ? 'active' : 'inactive'} /> },
  ];

  const displayData = isOnline ? data : (offlineData.data.length > 0 ? offlineData.data : data);

  return (
    <Box>
      <PageHeader title="Clients" subtitle={`${displayData.length} client(s)`}
        action={{ label: 'Nouveau client', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={displayData} loading={loading}
        searchFields={['name', 'contactName', 'type', 'phone', 'email']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le client' : 'Nouveau client'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
