import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';

const STATUS_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PAYE', label: 'Payé' },
  { value: 'PARTIEL', label: 'Partiel' },
  { value: 'ANNULE', label: 'Annulé' },
];

const formFields: FormField[] = [
  { name: 'reference', label: 'Référence', required: true, gridSize: 6 },
  { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0], gridSize: 6 },
  { name: 'totalAmount', label: 'Montant total (FCFA)', type: 'number', required: true, gridSize: 6 },
  { name: 'taxAmount', label: 'TVA (FCFA)', type: 'number', gridSize: 6 },
  { name: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS, defaultValue: 'EN_ATTENTE', gridSize: 6 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function PurchasesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/purchases', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/purchases/${editItem.id}`, formData);
      else await api.post('/modules/purchases', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/purchases/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    { id: 'reference', label: 'Référence', render: (row) => <Chip label={row.reference} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} /> },
    { id: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
    { id: 'totalAmount', label: 'Montant', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.totalAmount) + ' FCFA' },
    { id: 'taxAmount', label: 'TVA', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.taxAmount) + ' FCFA' },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
    { id: 'notes', label: 'Notes', render: (row) => <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{row.notes || '—'}</Typography> },
  ];

  return (
    <Box>
      <PageHeader title="Achats" subtitle={`${data.length} achat(s)`}
        action={{ label: 'Nouvel achat', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['reference', 'notes']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier l\'achat' : 'Nouvel achat'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
