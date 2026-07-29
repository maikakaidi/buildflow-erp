import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Avatar } from '@mui/material';
import { Inventory, Warning } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';
import { useOfflineData } from '../../hooks/useOfflineData';

const UNIT_OPTIONS = [
  { value: 'unité', label: 'Unité' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'm', label: 'Mètre' },
  { value: 'm2', label: 'Mètre carré' },
  { value: 'm3', label: 'Mètre cube' },
  { value: 'litre', label: 'Litre' },
  { value: 'tonne', label: 'Tonne' },
  { value: 'sac', label: 'Sac' },
  { value: 'barre', label: 'Barre' },
  { value: 'rouleau', label: 'Rouleau' },
];

const formFields: FormField[] = [
  { name: 'code', label: 'Code article', required: true, gridSize: 4 },
  { name: 'name', label: 'Nom', required: true, gridSize: 8 },
  { name: 'barcode', label: 'Code-barres', gridSize: 4 },
  { name: 'unit', label: 'Unité', type: 'select', options: UNIT_OPTIONS, defaultValue: 'unité', gridSize: 4 },
  { name: 'price', label: 'Prix unitaire (FCFA)', type: 'number', gridSize: 4 },
  { name: 'quantity', label: 'Quantité en stock', type: 'number', gridSize: 4 },
  { name: 'minQuantity', label: 'Seuil d\'alerte', type: 'number', gridSize: 4 },
  { name: 'location', label: 'Emplacement', gridSize: 4 },
  { name: 'description', label: 'Description', type: 'textarea', gridSize: 12 },
];

export default function StockPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();
  const offlineData = useOfflineData('stockItems');

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/stock-items', { limit: 500 });
      if (res.success) setData(res.data.items);
    } catch { await offlineData.refresh(); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) {
        if (isOnline) await api.put(`/modules/stock-items/${editItem.id}`, formData);
        else await offlineData.update(editItem.id, formData);
      } else {
        if (isOnline) await api.post('/modules/stock-items', formData);
        else await offlineData.add(formData);
      }
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try {
      if (isOnline) await api.delete(`/modules/stock-items/${row.id}`);
      else await offlineData.remove(row.id);
      loadData();
    } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    {
      id: 'code', label: 'Code', sortable: true,
      render: (row) => <Chip label={row.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />,
    },
    {
      id: 'name', label: 'Article', sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
          {row.description && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>{row.description}</Typography>}
        </Box>
      ),
    },
    { id: 'unit', label: 'Unité' },
    {
      id: 'quantity', label: 'Stock', align: 'right',
      render: (row) => {
        const isLow = row.quantity <= row.minQuantity;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
            {isLow && <Warning sx={{ fontSize: 16, color: 'warning.main' }} />}
            <Typography variant="body2" fontWeight={600} color={isLow ? 'warning.main' : 'text.primary'}>
              {row.quantity}
            </Typography>
          </Box>
        );
      },
    },
    { id: 'minQuantity', label: 'Seuil', align: 'right', render: (row) => row.minQuantity },
    {
      id: 'price', label: 'Prix', align: 'right',
      render: (row) => new Intl.NumberFormat('fr-FR').format(row.price) + ' FCFA',
    },
    { id: 'location', label: 'Emplacement', render: (row) => row.location || '—' },
  ];

  const displayData = isOnline ? data : (offlineData.data.length > 0 ? offlineData.data : data);
  const lowStockCount = displayData.filter((i: any) => i.quantity <= i.minQuantity).length;

  return (
    <Box>
      <PageHeader
        title="Stock"
        subtitle={`${displayData.length} article(s)${lowStockCount > 0 ? ` — ${lowStockCount} alerte(s)` : ''}`}
        action={{ label: 'Nouvel article', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={displayData} loading={loading}
        searchFields={['code', 'name', 'description', 'location']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier l\'article' : 'Nouvel article'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
