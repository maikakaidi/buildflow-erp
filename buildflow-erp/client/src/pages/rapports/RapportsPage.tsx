import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Select, MenuItem,
  FormControl, InputLabel, Button, Skeleton, Divider, useTheme,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Assessment, GetApp, Timeline, Inventory } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { generatePdf, downloadPdf } from '../../utils/pdf';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const COLORS = ['#4f8cff', '#dc004e', '#00c853', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

export default function RapportsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [period, setPeriod] = useState('12');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    purchases: [],
    expenses: [],
    invoices: [],
    presences: [],
    stock: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, purchasesRes, expensesRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/modules/purchases', { limit: 500 }),
        api.get('/modules/expenses', { limit: 500 }),
      ]);

      if (dashRes.data.success) {
        setData((prev: any) => ({
          ...prev,
          charts: dashRes.data.data.charts,
          stats: dashRes.data.data.stats,
        }));
      }
      if (purchasesRes.data.success) setData((prev: any) => ({ ...prev, purchases: purchasesRes.data.data.items }));
      if (expensesRes.data.success) setData((prev: any) => ({ ...prev, expenses: expensesRes.data.data.items }));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const formatAmount = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

  const expensesByCategory = data.expenses.reduce((acc: Record<string, number>, exp: any) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

  const CATEGORY_LABELS: Record<string, string> = {
    MATERIAU: 'Matériaux',
    MAIN_D_OEUVRE: 'Main d\'œuvre',
    TRANSPORT: 'Transport',
    EQUIPEMENT: 'Équipement',
    ADMINISTRATIF: 'Administratif',
    AUTRE: 'Autre',
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
        <Grid item xs={12} md={8}><Skeleton variant="rounded" height={350} sx={{ borderRadius: 3 }} /></Grid>
        <Grid item xs={12} md={4}><Skeleton variant="rounded" height={350} sx={{ borderRadius: 3 }} /></Grid>
      </Grid>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Rapports"
        subtitle="Analyse et statistiques"
        action={{ label: 'Exporter PDF', icon: <GetApp />, onClick: async () => {
          const doc = await generatePdf({
            title: 'Rapport financier',
            subtitle: `${data.expenses.length} dépenses, ${data.purchases.length} achats`,
            companyName: company?.name,
            companyLogo: company?.logo,
            primaryColor: company?.primaryColor,
            orientation: 'landscape',
            columns: [
              { header: 'Description', dataKey: 'description' },
              { header: 'Catégorie', dataKey: 'category' },
              { header: 'Date', dataKey: 'date' },
              { header: 'Montant', dataKey: 'amount', align: 'right' },
            ],
            data: [
              ...data.expenses.map((e: any) => ({
                description: e.description,
                category: CATEGORY_LABELS[e.category] || e.category,
                date: new Date(e.date).toLocaleDateString('fr-FR'),
                amount: e.amount,
              })),
              ...data.purchases.map((p: any) => ({
                description: p.reference,
                category: 'Achat',
                date: new Date(p.date).toLocaleDateString('fr-FR'),
                amount: p.totalAmount,
              })),
            ],
            footer: `${company?.name || 'BuildFlow ERP'} — Rapport financier`,
          });
          downloadPdf(doc, `rapport-${new Date().toISOString().slice(0, 10)}.pdf`);
        } }}
        onRefresh={loadData}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => navigate('/rapports/activite')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Timeline sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box><Typography variant="h6" fontWeight={600}>Activité</Typography><Typography variant="body2" color="text.secondary">Synthèse chantiers, finances</Typography></Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'warning.main' } }} onClick={() => navigate('/rapports/stock')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Inventory sx={{ fontSize: 40, color: 'warning.main' }} />
              <Box><Typography variant="h6" fontWeight={600}>Stock</Typography><Typography variant="body2" color="text.secondary">État des stocks et alertes</Typography></Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'success.main' } }} onClick={() => navigate('/dashboard')}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Assessment sx={{ fontSize: 40, color: 'success.main' }} />
              <Box><Typography variant="h6" fontWeight={600}>Dashboard</Typography><Typography variant="body2" color="text.secondary">Tableau de bord général</Typography></Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Évolution des achats mensuels</Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.charts?.monthlyPurchases || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3f" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8b8fa3' }}
                    tickFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR', { month: 'short' })} />
                  <YAxis tick={{ fontSize: 12, fill: '#8b8fa3' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1d29', border: '1px solid #2a2e3f', borderRadius: 8 }}
                    formatter={(value: number) => formatAmount(value)}
                  />
                  <Bar dataKey="total" fill="#4f8cff" radius={[4, 4, 0, 0]} name="Achats" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Dépenses par catégorie</Typography>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"                     label={({ name, percent }: { name: string; percent: number }) =>
                      `${(CATEGORY_LABELS[name] || name).substring(0, 8)} ${(percent * 100).toFixed(0)}%`
                    }>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" textAlign="center" py={4}>Aucune donnée</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Résumé financier</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total achats</Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {formatAmount(data.purchases.reduce((s: number, p: any) => s + (p.totalAmount || 0), 0))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Total dépenses</Typography>
                    <Typography variant="h6" fontWeight={700} color="error.main">
                      {formatAmount(data.expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Facturé</Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {formatAmount(data.stats?.invoiced || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Bénéfice</Typography>
                    <Typography variant="h6" fontWeight={700} color={(data.stats?.benefice || 0) >= 0 ? 'success.main' : 'error.main'}>
                      {formatAmount(data.stats?.benefice || 0)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Top 10 dépenses récentes</Typography>
              {data.expenses.slice(0, 10).map((exp: any, i: number) => (
                <Box key={exp.id || i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{exp.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(exp.date).toLocaleDateString('fr-FR')} — {CATEGORY_LABELS[exp.category] || exp.category}</Typography>
                  </Box>
                  <Typography variant="body2" color="error" fontWeight={600}>{formatAmount(exp.amount)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Top 10 achats récents</Typography>
              {data.purchases.slice(0, 10).map((pur: any, i: number) => (
                <Box key={pur.id || i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{pur.reference}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(pur.date).toLocaleDateString('fr-FR')}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{formatAmount(pur.totalAmount)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
