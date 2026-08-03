import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Grid, Card, CardContent, IconButton, Tooltip } from '@mui/material';
import { Receipt, GetApp, FileDownload } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import { generatePdf, downloadPdf, generateSingleInvoicePdf } from '../../utils/pdf';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const STATUS_OPTIONS = [
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'EMISE', label: 'Émise' },
  { value: 'PAYEE', label: 'Payée' },
  { value: 'PARTIELLEMENT_PAYEE', label: 'Partiellement payée' },
  { value: 'EN_RETARD', label: 'En retard' },
  { value: 'ANNULEE', label: 'Annulée' },
];

const formFields: FormField[] = [
  { name: 'number', label: 'Numéro', required: true, gridSize: 6 },
  { name: 'date', label: 'Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0], gridSize: 6 },
  { name: 'dueDate', label: 'Échéance', type: 'date', gridSize: 6 },
  { name: 'subtotal', label: 'Sous-total', type: 'number', required: true, gridSize: 6 },
  { name: 'taxRate', label: 'Taux TVA (%)', type: 'number', defaultValue: 0, gridSize: 6 },
  { name: 'taxAmount', label: 'TVA (FCFA)', type: 'number', defaultValue: 0, gridSize: 6 },
  { name: 'total', label: 'Total', type: 'number', required: true, gridSize: 6 },
  { name: 'paidAmount', label: 'Montant payé', type: 'number', defaultValue: 0, gridSize: 6 },
  { name: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS, defaultValue: 'BROUILLON', gridSize: 6 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function InvoicesPage() {
  const [data, setData] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { company } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, compRes] = await Promise.all([
        api.get('/modules/invoices', { limit: 200 }),
        api.get('/settings/company'),
      ]);
      if (invRes.data.success) setData(invRes.data.data.items);
      if (compRes.data.success) setCompanyData(compRes.data.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const pdfCompany = companyData || company;

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      let created: any = null;
      if (editItem) {
        await api.put(`/modules/invoices/${editItem.id}`, formData);
      } else {
        const { data: res } = await api.post('/modules/invoices', formData);
        if (res.success) created = res.data;
      }
      setDialogOpen(false); setEditItem(null); loadData();

      if (created) {
        const doc = generateSingleInvoicePdf(created, pdfCompany);
        downloadPdf(doc, `facture-${created.number}-${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/invoices/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const handleExportPdf = (rows: any[]) => {
    const doc = generatePdf({
      title: 'Liste des Factures',
      subtitle: `${rows.length} facture(s)`,
      companyName: pdfCompany?.name || 'BuildFlow ERP',
      companyLogo: pdfCompany?.logo,
      primaryColor: pdfCompany?.primaryColor,
      columns: [
        { header: 'N°', dataKey: 'number', width: 30 },
        { header: 'Date', dataKey: 'date', width: 25 },
        { header: 'Échéance', dataKey: 'dueDate', width: 25 },
        { header: 'Total', dataKey: 'total', align: 'right' },
        { header: 'Payé', dataKey: 'paidAmount', align: 'right' },
        { header: 'Statut', dataKey: 'status' },
      ],
      data: rows.map((r) => ({
        number: r.number,
        date: new Date(r.date).toLocaleDateString('fr-FR'),
        dueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString('fr-FR') : '—',
        total: r.total,
        paidAmount: r.paidAmount,
        status: STATUS_OPTIONS.find((s) => s.value === r.status)?.label || r.status,
      })),
      footer: `${pdfCompany?.name || 'BuildFlow ERP'} — Facturation`,
    });
    downloadPdf(doc, `factures-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleSinglePdf = (row: any) => {
    const doc = generateSingleInvoicePdf(row, pdfCompany);
    downloadPdf(doc, `facture-${row.number}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const totalFacture = data.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaye = data.reduce((s, i) => s + (i.paidAmount || 0), 0);

  const columns: Column<any>[] = [
    { id: 'number', label: 'N°', sortable: true, render: (row) => <Chip label={row.number} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} /> },
    { id: 'client', label: 'Client', render: (row) => row.client?.name || '—' },
    { id: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
    { id: 'dueDate', label: 'Échéance', render: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString('fr-FR') : '—' },
    { id: 'total', label: 'Total', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.total) + ' FCFA' },
    { id: 'paidAmount', label: 'Payé', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.paidAmount) + ' FCFA' },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
    {
      id: 'actions', label: '', align: 'center',
      render: (row) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleSinglePdf(row); }} sx={{ color: 'primary.main' }}>
          <FileDownload fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Facturation" subtitle={`${data.length} facture(s) — Total: ${new Intl.NumberFormat('fr-FR').format(totalFacture)} FCFA`}
        action={{ label: 'Nouvelle facture', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total facturé</Typography>
              <Typography variant="h5" fontWeight={700}>{new Intl.NumberFormat('fr-FR').format(totalFacture)} FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total perçu</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">{new Intl.NumberFormat('fr-FR').format(totalPaye)} FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Reste à percevoir</Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">{new Intl.NumberFormat('fr-FR').format(totalFacture - totalPaye)} FCFA</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['number', 'status']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier la facture' : 'Nouvelle facture'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
