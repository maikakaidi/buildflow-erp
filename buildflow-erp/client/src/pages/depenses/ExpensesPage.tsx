import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Receipt } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';
import { useOfflineData } from '../../hooks/useOfflineData';

const CATEGORY_OPTIONS = [
  { value: 'MATERIAU', label: 'Matériau' },
  { value: 'MAIN_D_OEUVRE', label: 'Main d\'œuvre' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'EQUIPEMENT', label: 'Équipement' },
  { value: 'ADMINISTRATIF', label: 'Administratif' },
  { value: 'AUTRE', label: 'Autre' },
];

const formFields: FormField[] = [
  { name: 'description', label: 'Description', required: true, gridSize: 12 },
  { name: 'category', label: 'Catégorie', type: 'select', options: CATEGORY_OPTIONS, required: true, gridSize: 6 },
  { name: 'amount', label: 'Montant (FCFA)', type: 'number', required: true, gridSize: 6 },
  { name: 'date', label: 'Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0], gridSize: 6 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function ExpensesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();
  const offlineData = useOfflineData('expenses');

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/expenses', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch { await offlineData.refresh(); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) {
        if (isOnline) await api.put(`/modules/expenses/${editItem.id}`, formData);
        else await offlineData.update(editItem.id, formData);
      } else {
        if (isOnline) await api.post('/modules/expenses', formData);
        else await offlineData.add(formData);
      }
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try {
      if (isOnline) await api.delete(`/modules/expenses/${row.id}`);
      else await offlineData.remove(row.id);
      loadData();
    } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    { id: 'description', label: 'Description', sortable: true, render: (row) => <Typography variant="body2" fontWeight={500}>{row.description}</Typography> },
    {
      id: 'category', label: 'Catégorie',
      render: (row) => {
        const opt = CATEGORY_OPTIONS.find((c) => c.value === row.category);
        return <Chip label={opt?.label || row.category} size="small" variant="outlined" />;
      },
    },
    { id: 'amount', label: 'Montant', align: 'right', render: (row) => <Typography color="error" fontWeight={600}>{new Intl.NumberFormat('fr-FR').format(row.amount)} FCFA</Typography> },
    { id: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
  ];

  const total = data.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <Box>
      <PageHeader title="Dépenses" subtitle={`${data.length} dépense(s) — Total: ${new Intl.NumberFormat('fr-FR').format(total)} FCFA`}
        action={{ label: 'Nouvelle dépense', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['description', 'category']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier la dépense' : 'Nouvelle dépense'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
