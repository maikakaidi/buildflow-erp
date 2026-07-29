import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AttachMoney } from '@mui/icons-material';
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
];

const formFields: FormField[] = [
  { name: 'month', label: 'Mois (1-12)', type: 'number', required: true, gridSize: 4 },
  { name: 'year', label: 'Année', type: 'number', required: true, defaultValue: new Date().getFullYear(), gridSize: 4 },
  { name: 'baseSalary', label: 'Salaire de base', type: 'number', required: true, gridSize: 4 },
  { name: 'bonus', label: 'Prime', type: 'number', defaultValue: 0, gridSize: 4 },
  { name: 'deduction', label: 'Retenue', type: 'number', defaultValue: 0, gridSize: 4 },
  { name: 'cnss', label: 'CNSS', type: 'number', defaultValue: 0, gridSize: 4 },
  { name: 'netSalary', label: 'Net à payer', type: 'number', required: true, gridSize: 4 },
  { name: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS, defaultValue: 'EN_ATTENTE', gridSize: 4 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function SalariesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/salaries', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/salaries/${editItem.id}`, formData);
      else await api.post('/modules/salaries', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/salaries/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const MONTH_NAMES = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const columns: Column<any>[] = [
    {
      id: 'month', label: 'Période', sortable: true,
      render: (row) => <Typography variant="body2" fontWeight={600}>{MONTH_NAMES[row.month]} {row.year}</Typography>,
    },
    { id: 'baseSalary', label: 'Base', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.baseSalary) + ' FCFA' },
    { id: 'bonus', label: 'Prime', align: 'right', render: (row) => row.bonus > 0 ? new Intl.NumberFormat('fr-FR').format(row.bonus) + ' FCFA' : '—' },
    { id: 'cnss', label: 'CNSS', align: 'right', render: (row) => row.cnss > 0 ? new Intl.NumberFormat('fr-FR').format(row.cnss) + ' FCFA' : '—' },
    { id: 'netSalary', label: 'Net', align: 'right', render: (row) => <Typography fontWeight={700}>{new Intl.NumberFormat('fr-FR').format(row.netSalary)} FCFA</Typography> },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
  ];

  return (
    <Box>
      <PageHeader title="Salaires" subtitle={`${data.length} bulletin(s)`}
        action={{ label: 'Nouveau bulletin', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le bulletin' : 'Nouveau bulletin'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
