import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Grid, Card, CardContent, IconButton, Tooltip, Button } from '@mui/material';
import { Today, GetApp } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import { generatePdf, downloadPdf, formatPdfDate } from '../../utils/pdf';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function DailyReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { company } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, cRes] = await Promise.all([
        api.get('/modules/daily-reports', { limit: 500 }),
        api.get('/modules/chantiers', { limit: 500 }),
      ]);
      if (rRes.data.success) setData(rRes.data.data.items);
      if (cRes.data.success) setChantiers(cRes.data.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (formData.photos && typeof formData.photos === 'string') {
        formData.photos = formData.photos.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (editItem) await api.put(`/modules/daily-reports/${editItem.id}`, formData);
      else await api.post('/modules/daily-reports', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/daily-reports/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const formFields: FormField[] = [
    { name: 'chantierId', label: 'Chantier', type: 'select', required: true, options: chantiers.map((c: any) => ({ value: c.id, label: c.name })), gridSize: 6 },
    { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0], gridSize: 6 },
    { name: 'weather', label: 'Météo', gridSize: 4 },
    { name: 'workersOnSite', label: 'Ouvriers présents', type: 'number', defaultValue: 0, gridSize: 4 },
    { name: 'workDone', label: 'Travail effectué', type: 'textarea', required: true, gridSize: 12 },
    { name: 'issues', label: 'Problèmes rencontrés', type: 'textarea', gridSize: 12 },
    { name: 'tomorrowPlan', label: 'Prévision du lendemain', type: 'textarea', gridSize: 12 },
    { name: 'photos', label: 'Photos (URLs séparées par des virgules)', gridSize: 12 },
  ];

  const handlePdf = async (rows: any[]) => {
    const doc = await generatePdf({
      title: 'Rapports journaliers',
      subtitle: `${rows.length} rapport(s)`,
      companyName: company?.name,
      companyLogo: company?.logo,
      primaryColor: company?.primaryColor,
      orientation: 'landscape',
      columns: [
        { header: 'Date', dataKey: 'date' },
        { header: 'Chantier', dataKey: 'chantier' },
        { header: 'Météo', dataKey: 'weather' },
        { header: 'Ouvriers', dataKey: 'workers', align: 'right' },
        { header: 'Travail', dataKey: 'workDone' },
        { header: 'Problèmes', dataKey: 'issues' },
      ],
      data: rows.map((r: any) => {
        const c = chantiers.find((ch: any) => ch.id === r.chantierId);
        return {
          date: new Date(r.date).toLocaleDateString('fr-FR'),
          chantier: c?.name || '—',
          weather: r.weather || '—',
          workers: r.workersOnSite || 0,
          workDone: r.workDone?.substring(0, 100) || '—',
          issues: r.issues?.substring(0, 100) || '—',
        };
      }),
      footer: `${company?.name || 'BuildFlow ERP'} — Rapports journaliers`,
    });
    downloadPdf(doc, `rapports-journaliers-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const columns: Column<any>[] = [
    { id: 'date', label: 'Date', sortable: true, render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
    { id: 'chantierId', label: 'Chantier', render: (row) => { const c = chantiers.find((ch: any) => ch.id === row.chantierId); return c?.name || '—'; } },
    { id: 'weather', label: 'Météo', render: (row) => row.weather || '—' },
    { id: 'workersOnSite', label: 'Ouvriers', align: 'right' },
    { id: 'workDone', label: 'Travail effectué', render: (row) => <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>{row.workDone}</Typography> },
    { id: 'issues', label: 'Problèmes', render: (row) => row.issues ? <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{row.issues}</Typography> : '—' },
    { id: 'photos', label: 'Photos', render: (row) => Array.isArray(row.photos) && row.photos.length > 0 ? <Chip label={`${row.photos.length} photo(s)`} size="small" /> : '—' },
  ];

  return (
    <Box>
      <PageHeader title="Rapports journaliers" subtitle={`${data.length} rapport(s)`}
        action={{ label: 'Nouveau rapport', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" startIcon={<GetApp />} size="small" onClick={() => handlePdf(data)}>
          Exporter PDF
        </Button>
      </Box>
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['workDone', 'issues']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le rapport' : 'Nouveau rapport journalier'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
