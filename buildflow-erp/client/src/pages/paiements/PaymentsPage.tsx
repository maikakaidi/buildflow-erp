import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material';
import { Payment } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';

const METHOD_OPTIONS = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'AUTRE', label: 'Autre' },
];

const formFields: FormField[] = [
  { name: 'amount', label: 'Montant (FCFA)', type: 'number', required: true, gridSize: 6 },
  { name: 'method', label: 'Mode de paiement', type: 'select', options: METHOD_OPTIONS, required: true, defaultValue: 'ESPECES', gridSize: 6 },
  { name: 'date', label: 'Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0], gridSize: 6 },
  { name: 'reference', label: 'Référence', gridSize: 6 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function PaymentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/payments', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/payments/${editItem.id}`, formData);
      else await api.post('/modules/payments', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/payments/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const totalPaye = data.reduce((s, p) => s + (p.amount || 0), 0);

  const columns: Column<any>[] = [
    { id: 'date', label: 'Date', sortable: true, render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
    { id: 'amount', label: 'Montant', align: 'right', render: (row) => <Typography fontWeight={700}>{new Intl.NumberFormat('fr-FR').format(row.amount)} FCFA</Typography> },
    {
      id: 'method', label: 'Mode',
      render: (row) => <Chip label={METHOD_OPTIONS.find((m) => m.value === row.method)?.label || row.method} size="small" variant="outlined" />,
    },
    { id: 'reference', label: 'Référence', render: (row) => row.reference || '—' },
    { id: 'notes', label: 'Notes', render: (row) => <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>{row.notes || '—'}</Typography> },
  ];

  return (
    <Box>
      <PageHeader title="Paiements" subtitle={`${data.length} paiement(s) — Total: ${new Intl.NumberFormat('fr-FR').format(totalPaye)} FCFA`}
        action={{ label: 'Nouveau paiement', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total paiements</Typography>
              <Typography variant="h5" fontWeight={700}>{new Intl.NumberFormat('fr-FR').format(totalPaye)} FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Nombre de paiements</Typography>
              <Typography variant="h5" fontWeight={700}>{data.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Dernier paiement</Typography>
              <Typography variant="body1" fontWeight={600}>
                {data.length > 0 ? new Date(data[0].date).toLocaleDateString('fr-FR') : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['reference', 'method', 'notes']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le paiement' : 'Nouveau paiement'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
