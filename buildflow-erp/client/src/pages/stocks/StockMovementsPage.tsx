import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import api from '../../api/client';

const TYPE_OPTIONS = [
  { value: 'ENTREE', label: 'Entrée' },
  { value: 'SORTIE', label: 'Sortie' },
];

export default function StockMovementsPage() {
  const [data, setData] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [movRes, itemRes] = await Promise.all([
        api.get('/modules/stock-movements', { limit: 500 }),
        api.get('/modules/stock-items', { limit: 500 }),
      ]);
      if (movRes.data.success) setData(movRes.data.data.items);
      if (itemRes.data.success) setItems(itemRes.data.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/stock-movements/${editItem.id}`, formData);
      else await api.post('/modules/stock-movements', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/stock-movements/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const formFields: FormField[] = [
    { name: 'itemId', label: 'Article', type: 'select', required: true, options: items.map((i: any) => ({ value: i.id, label: `${i.code} — ${i.name}` })), gridSize: 6 },
    { name: 'type', label: 'Type', type: 'select', options: TYPE_OPTIONS, required: true, gridSize: 3 },
    { name: 'quantity', label: 'Quantité', type: 'number', required: true, gridSize: 3 },
    { name: 'reference', label: 'Référence (bon/bl)', gridSize: 4 },
    { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
  ];

  const columns: Column<any>[] = [
    { id: 'date', label: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
    {
      id: 'itemId', label: 'Article', render: (row) => {
        const item = items.find((i: any) => i.id === row.itemId);
        return item ? `${item.code} — ${item.name}` : row.itemId;
      },
    },
    {
      id: 'type', label: 'Type',
      render: (row) => <Chip label={row.type === 'ENTREE' ? 'Entrée' : 'Sortie'} size="small" color={row.type === 'ENTREE' ? 'success' : 'error'} />,
    },
    { id: 'quantity', label: 'Qté', align: 'right', render: (row) => row.quantity },
    { id: 'reference', label: 'Réf.', render: (row) => row.reference || '—' },
    { id: 'notes', label: 'Notes', render: (row) => row.notes || '—' },
  ];

  const entrees = data.filter((m: any) => m.type === 'ENTREE').reduce((s: number, m: any) => s + m.quantity, 0);
  const sorties = data.filter((m: any) => m.type === 'SORTIE').reduce((s: number, m: any) => s + m.quantity, 0);

  return (
    <Box>
      <PageHeader title="Mouvements de stock" subtitle={`${data.length} mouvement(s) — Entrées: ${entrees}, Sorties: ${sorties}`}
        action={{ label: 'Nouveau mouvement', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['reference', 'notes']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le mouvement' : 'Nouveau mouvement'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
