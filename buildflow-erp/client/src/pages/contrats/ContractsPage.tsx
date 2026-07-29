import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Work } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';

const TYPE_OPTIONS = [
  { value: 'CDD', label: 'CDD' },
  { value: 'CDI', label: 'CDI' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'SOUS_TRAITANT', label: 'Sous-traitant' },
];

const formFields: FormField[] = [
  { name: 'title', label: 'Titre', required: true, gridSize: 12 },
  { name: 'type', label: 'Type', type: 'select', options: TYPE_OPTIONS, required: true, gridSize: 6 },
  { name: 'startDate', label: 'Date début', type: 'date', required: true, gridSize: 6 },
  { name: 'endDate', label: 'Date fin', type: 'date', gridSize: 6 },
  { name: 'salary', label: 'Salaire (FCFA)', type: 'number', gridSize: 6 },
  { name: 'status', label: 'Statut', type: 'select', options: [{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }, { value: 'expired', label: 'Expiré' }], defaultValue: 'active', gridSize: 6 },
  { name: 'terms', label: 'Conditions', type: 'textarea', gridSize: 12 },
];

export default function ContractsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/contracts', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/contracts/${editItem.id}`, formData);
      else await api.post('/modules/contracts', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/contracts/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    { id: 'title', label: 'Titre', sortable: true, render: (row) => <Typography fontWeight={600}>{row.title}</Typography> },
    { id: 'type', label: 'Type', render: (row) => <Chip label={TYPE_OPTIONS.find((t) => t.value === row.type)?.label || row.type} size="small" variant="outlined" /> },
    { id: 'startDate', label: 'Début', render: (row) => new Date(row.startDate).toLocaleDateString('fr-FR') },
    { id: 'endDate', label: 'Fin', render: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('fr-FR') : 'CDI' },
    { id: 'salary', label: 'Salaire', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.salary) + ' FCFA' },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
  ];

  return (
    <Box>
      <PageHeader title="Contrats" subtitle={`${data.length} contrat(s)`}
        action={{ label: 'Nouveau contrat', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['title', 'type']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le contrat' : 'Nouveau contrat'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
