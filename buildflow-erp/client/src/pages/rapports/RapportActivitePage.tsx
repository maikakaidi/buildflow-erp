import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination } from '@mui/material';
import { GetApp } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { generatePdf, downloadPdf, formatPdfAmount, formatPdfDate } from '../../utils/pdf';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function RapportActivitePage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [presences, setPresences] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    Promise.all([
      api.get('/modules/chantiers', { limit: 500 }),
      api.get('/modules/employees', { limit: 500 }),
      api.get('/modules/expenses', { limit: 1000 }),
      api.get('/modules/purchases', { limit: 1000 }),
      api.get('/modules/presences', { limit: 2000 }),
      api.get('/modules/invoices', { limit: 1000 }),
    ]).then(([c, e, ex, p, pr, i]) => {
      if (c.data.success) setChantiers(c.data.data.items);
      if (e.data.success) setEmployees(e.data.data.items);
      if (ex.data.success) setExpenses(ex.data.data.items);
      if (p.data.success) setPurchases(p.data.data.items);
      if (pr.data.success) setPresences(pr.data.data.items);
      if (i.data.success) setInvoices(i.data.data.items);
    }).finally(() => setLoading(false));
  }, []);

  const totalDepenses = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalAchats = purchases.reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
  const totalFacture = invoices.reduce((s: number, i: any) => s + (i.total || 0), 0);
  const totalPaye = invoices.reduce((s: number, i: any) => s + (i.paidAmount || 0), 0);
  const totalPresences = presences.length;
  const presentes = presences.filter((p: any) => p.status === 'PRESENT').length;

  const chantierStats = chantiers.map((c: any) => {
    const chExpenses = expenses.filter((e: any) => e.chantierId === c.id);
    const chPresences = presences.filter((p: any) => p.chantierId === c.id);
    const chEmployees = employees.filter((e: any) => e.chantierId === c.id);
    return { ...c, totalDepense: chExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0), nbPresences: chPresences.length, nbEmployees: chEmployees.length };
  });

  const handlePdf = async () => {
    const doc = await generatePdf({
      title: "Rapport d'activité",
      subtitle: `${chantiers.length} chantier(s), ${employees.length} employé(s)`,
      companyName: company?.name,
      companyLogo: company?.logo,
      primaryColor: company?.primaryColor,
      orientation: 'landscape',
      columns: [
        { header: 'Chantier', dataKey: 'chantier' },
        { header: 'Statut', dataKey: 'statut' },
        { header: 'Employés', dataKey: 'employes', align: 'right' },
        { header: 'Dépenses', dataKey: 'depenses', align: 'right' },
        { header: 'Présences', dataKey: 'presences', align: 'right' },
      ],
      data: chantierStats.map((c: any) => ({
        chantier: c.name,
        statut: c.status,
        employes: c.nbEmployees,
        depenses: c.totalDepense,
        presences: c.nbPresences,
      })),
      footer: `${company?.name || 'BuildFlow ERP'} — Rapport d'activité`,
    });
    downloadPdf(doc, `rapport-activite-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Box>
      <PageHeader title="Rapport d'activité" subtitle="Synthèse chantiers, employés, finances"
        action={{ label: 'Exporter PDF', icon: <GetApp />, onClick: handlePdf }}
        onRefresh={() => window.location.reload()}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Chantiers</Typography><Typography variant="h5" fontWeight={700}>{chantiers.length}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Employés</Typography><Typography variant="h5" fontWeight={700}>{employees.length}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Facturé</Typography><Typography variant="h5" fontWeight={700} color="success.main">{formatPdfAmount(totalFacture)}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Perçu</Typography><Typography variant="h5" fontWeight={700} color="info.main">{formatPdfAmount(totalPaye)}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Dépenses</Typography><Typography variant="h5" fontWeight={700} color="error.main">{formatPdfAmount(totalDepenses)}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Achats</Typography><Typography variant="h5" fontWeight={700} color="warning.main">{formatPdfAmount(totalAchats)}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Bénéfice</Typography><Typography variant="h5" fontWeight={700} color={totalPaye - totalDepenses - totalAchats >= 0 ? 'success.main' : 'error.main'}>{formatPdfAmount(totalPaye - totalDepenses - totalAchats)}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Présences</Typography><Typography variant="h5" fontWeight={700}>{presentes}/{totalPresences}</Typography></CardContent></Card></Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>Détail par chantier</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Chantier</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Employés</TableCell>
                  <TableCell align="right">Dépenses</TableCell>
                  <TableCell align="right">Présences</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chantierStats.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell><Typography variant="body2" fontWeight={500}>{c.name}</Typography></TableCell>
                    <TableCell><Chip label={c.status} size="small" /></TableCell>
                    <TableCell align="right">{c.nbEmployees}</TableCell>
                    <TableCell align="right">{formatPdfAmount(c.totalDepense)}</TableCell>
                    <TableCell align="right">{c.nbPresences}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={chantierStats.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
        </CardContent>
      </Card>
    </Box>
  );
}
