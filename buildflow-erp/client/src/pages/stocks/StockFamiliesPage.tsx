import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Category } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import api from '../../api/client';

const CATEGORY_OPTIONS = [
  { value: 'EPI', label: 'EPI' },
  { value: 'OUTILS', label: 'Outils' },
  { value: 'TERRASSEMENT', label: 'Terrassement' },
  { value: 'FERRAILLAGE', label: 'Ferraillage' },
  { value: 'MACHINES', label: 'Machines' },
  { value: 'MATERIAUX', label: 'Matériaux' },
  { value: 'CONSOMMABLES', label: 'Consommables' },
  { value: 'INSTALLATIONS', label: 'Installations' },
];

const formFields: FormField[] = [
  { name: 'name', label: 'Nom de la famille', type: 'select', options: CATEGORY_OPTIONS, required: true, gridSize: 8 },
  { name: 'description', label: 'Description', type: 'textarea', gridSize: 12 },
];

export default function StockFamiliesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/stock-families', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/stock-families/${editItem.id}`, formData);
      else await api.post('/modules/stock-families', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/stock-families/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    {
      id: 'name', label: 'Famille', sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Category color="primary" />
          <Typography fontWeight={600}>
            {CATEGORY_OPTIONS.find((c) => c.value === row.name)?.label || row.name}
          </Typography>
        </Box>
      ),
    },
    { id: 'description', label: 'Description', render: (row) => row.description || '—' },
    {
      id: '_count', label: 'Articles',
      render: (row) => <Chip label={row._count?.items || 0} size="small" variant="outlined" />,
    },
  ];

  return (
    <Box>
      <PageHeader title="Familles de stock" subtitle={`${data.length} famille(s)`}
        action={{ label: 'Nouvelle famille', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['name', 'description']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier la famille' : 'Nouvelle famille'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
