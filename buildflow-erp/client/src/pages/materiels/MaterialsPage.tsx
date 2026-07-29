import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Warehouse } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
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
  { name: 'name', label: 'Nom', required: true, gridSize: 8 },
  { name: 'category', label: 'Catégorie', type: 'select', options: CATEGORY_OPTIONS, required: true, gridSize: 4 },
  { name: 'brand', label: 'Marque', gridSize: 6 },
  { name: 'model', label: 'Modèle', gridSize: 6 },
  { name: 'serialNumber', label: 'N° série', gridSize: 6 },
  { name: 'purchasePrice', label: 'Prix d\'achat', type: 'number', gridSize: 6 },
  { name: 'currentValue', label: 'Valeur actuelle', type: 'number', gridSize: 6 },
  { name: 'status', label: 'Statut', type: 'select', options: [{ value: 'operational', label: 'Opérationnel' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'outOfService', label: 'Hors service' }], defaultValue: 'operational', gridSize: 6 },
  { name: 'location', label: 'Emplacement', gridSize: 6 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function MaterialsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/materials', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/materials/${editItem.id}`, formData);
      else await api.post('/modules/materials', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/materials/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    { id: 'name', label: 'Nom', sortable: true, render: (row) => <Typography fontWeight={600}>{row.name}</Typography> },
    { id: 'category', label: 'Catégorie', render: (row) => <Chip label={CATEGORY_OPTIONS.find((c) => c.value === row.category)?.label || row.category} size="small" variant="outlined" /> },
    { id: 'brand', label: 'Marque', render: (row) => row.brand || '—' },
    { id: 'model', label: 'Modèle', render: (row) => row.model || '—' },
    { id: 'purchasePrice', label: 'Prix achat', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.purchasePrice) + ' FCFA' },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
  ];

  return (
    <Box>
      <PageHeader title="Matériels" subtitle={`${data.length} matériel(aux)`}
        action={{ label: 'Nouveau matériel', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['name', 'brand', 'model', 'serialNumber']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le matériel' : 'Nouveau matériel'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
