import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, useTheme, alpha, Skeleton, Avatar,
  LinearProgress, Chip, Button,
} from '@mui/material';
import {
  Construction, People, Engineering, Inventory, ShoppingCart, Receipt,
  AttachMoney, EventNote, TrendingUp, TrendingDown,
  Warning, CheckCircle, Schedule, ErrorOutline, OpenInNew,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';

interface DashboardData {
  company: {
    name: string;
    logo: string | null;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    country: string | null;
    currency: string;
  } | null;
  stats: {
    chantiers: number;
    employees: number;
    workers: number;
    stockItems: number;
    purchases: number;
    expenses: number;
    presences: number;
    invoiced: number;
    paid: number;
    benefice: number;
    materials: number;
    vehicles: number;
    lowStock: number;
  };
  charts: {
    monthlyPurchases: any[];
    monthlyExpenses: any[];
  };
  recentExpenses: any[];
  alerts: any[];
  subscription: {
    plan: string;
    status: string;
    endDate: string;
    daysRemaining: number;
    isExpired: boolean;
  } | null;
}

function StatCard({ title, value, icon, color, subtitle }: any) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 52, height: 52 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: response } = await api.get('/dashboard');
        if (response.success) setData(response.data);
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(8)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
        <Grid item xs={12} md={8}><Skeleton variant="rounded" height={350} sx={{ borderRadius: 3 }} /></Grid>
        <Grid item xs={12} md={4}><Skeleton variant="rounded" height={350} sx={{ borderRadius: 3 }} /></Grid>
      </Grid>
    );
  }

  if (!data) return <Typography>Erreur de chargement</Typography>;

  const formatAmount = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
  const sub = data.subscription;
  const openWhatsApp = (num: string) => window.open(`https://wa.me/227${num}`, '_blank');
  const needsPayment = !sub || sub.isExpired || sub.daysRemaining <= 30;

  return (
    <Box>
      {sub && (
        <Card sx={{
          mb: 3, p: 2,
          bgcolor: sub.isExpired
            ? alpha(theme.palette.error.main, 0.08)
            : sub.daysRemaining <= 30
              ? alpha(theme.palette.warning.main, 0.08)
              : alpha(theme.palette.success.main, 0.08),
          border: 1,
          borderColor: sub.isExpired
            ? alpha(theme.palette.error.main, 0.3)
            : sub.daysRemaining <= 30
              ? alpha(theme.palette.warning.main, 0.3)
              : alpha(theme.palette.success.main, 0.3),
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {sub.isExpired ? (
                <ErrorOutline sx={{ color: theme.palette.error.main }} />
              ) : sub.daysRemaining <= 30 ? (
                <Schedule sx={{ color: theme.palette.warning.main }} />
              ) : (
                <CheckCircle sx={{ color: theme.palette.success.main }} />
              )}
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {sub.isExpired ? 'Hébergement expiré' : `Hébergement actif — ${sub.daysRemaining} jour(s) restant(s)`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expire le {new Date(sub.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={sub.isExpired ? 'Expiré' : sub.status === 'TRIAL' ? 'Essai' : 'Actif'}
              color={sub.isExpired ? 'error' : sub.daysRemaining <= 30 ? 'warning' : 'success'}
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          {!sub.isExpired && (
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (sub.daysRemaining / 365) * 100)}
              color={sub.daysRemaining <= 30 ? 'warning' : 'success'}
              sx={{ height: 6, borderRadius: 3, mt: 1 }}
            />
          )}
          {sub.isExpired && (
            <Typography variant="body2" color="error" mt={1} fontWeight={500}>
              Contactez le support pour renouveler votre hébergement.
            </Typography>
          )}
          {needsPayment && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Paiement hébergement :</Typography>
              <Button size="small" variant="outlined" color="success" startIcon={<OpenInNew />}
                onClick={() => openWhatsApp('99293329')}>
                Airtel : 99 29 33 29
              </Button>
              <Button size="small" variant="outlined" color="info" startIcon={<OpenInNew />}
                onClick={() => openWhatsApp('92666942')}>
                Orange : 92 66 69 42
              </Button>
            </Box>
          )}
        </Card>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
        {data.company?.logo && (
          <Avatar
            src={data.company.logo}
            sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            variant="rounded"
          />
        )}
        <Box>
          <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1.1 }}>
            {data.company?.name || 'Tableau de bord'}
          </Typography>
          {data.company?.address && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {data.company.address}{data.company.country ? `, ${data.company.country}` : ''}
            </Typography>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Chantiers" value={data.stats.chantiers} icon={<Construction />} color={theme.palette.primary.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Employés" value={data.stats.employees} icon={<People />} color={theme.palette.success.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Ouvriers" value={data.stats.workers} icon={<Engineering />} color="#9c27b0" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Stock" value={data.stats.stockItems} icon={<Inventory />} color="#ff9800" subtitle={data.stats.lowStock > 0 ? `${data.stats.lowStock} alertes` : undefined} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Achats" value={formatAmount(data.stats.purchases)} icon={<ShoppingCart />} color="#00bcd4" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Dépenses" value={formatAmount(data.stats.expenses)} icon={<Receipt />} color={theme.palette.error.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Bénéfices" value={formatAmount(data.stats.benefice)} icon={data.stats.benefice >= 0 ? <TrendingUp /> : <TrendingDown />} color={data.stats.benefice >= 0 ? theme.palette.success.main : theme.palette.error.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Présences" value={data.stats.presences} icon={<EventNote />} color="#4caf50" subtitle="Aujourd'hui" />
        </Grid>
      </Grid>

      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Évolution mensuelle</Typography>
              {data.charts.monthlyPurchases.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.charts.monthlyPurchases}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} tickFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR', { month: 'short' })} />
                    <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
                      formatter={(value: number) => formatAmount(value)}
                    />
                    <Bar dataKey="total" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} name="Achats" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                  <Typography color="text.secondary">Aucune donnée pour le moment</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Alertes</Typography>
              {data.stats.lowStock > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                  <Warning color="warning" />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Stock faible</Typography>
                    <Typography variant="caption" color="text.secondary">{data.stats.lowStock} articles en dessous du seuil</Typography>
                  </Box>
                </Box>
              )}
              {data.stats.lowStock === 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                  <CheckCircle color="success" />
                  <Typography variant="body2" color="text.secondary">Aucune alerte</Typography>
                </Box>
              )}

              <Typography variant="subtitle2" mt={3} mb={1}>Dernières dépenses</Typography>
              {data.recentExpenses.length > 0 ? data.recentExpenses.slice(0, 5).map((exp: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>{exp.description}</Typography>
                  <Typography variant="body2" color="error" fontWeight={600}>{formatAmount(exp.amount)}</Typography>
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">Aucune dépense</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
