import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Skeleton, alpha, useTheme,
} from '@mui/material';
import {
  Business, People, AttachMoney, Sync,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/client';

interface DashboardData {
  stats: {
    totalCompanies: number;
    totalUsers: number;
    trialSubscriptions: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    suspendedSubscriptions: number;
    totalRevenue: number;
  };
  companies: any[];
  recentLogins: any[];
}

const COLORS = { primary: '#4f8cff', success: '#00c853', warning: '#ff9800', error: '#dc004e', purple: '#9c27b0', cyan: '#00bcd4' };

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 52, height: 52 }}>{icon}</Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const BAR_COLORS = [COLORS.warning, COLORS.success, COLORS.error, COLORS.purple];

export default function SuperAdminDashboardPage() {
  const theme = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/super-admin/dashboard')
      .then(({ data: res }) => {
        if (res.success) setData(res.data);
        else setError('Erreur de chargement');
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(err.response?.data?.message || 'Erreur de chargement');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
        <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} /></Grid>
        <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} /></Grid>
        <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} /></Grid>
      </Grid>
    );
  }

  if (error || !data) return <Typography color="error" sx={{ p: 3 }}>{error || 'Erreur de chargement'}</Typography>;

  const { stats, companies, recentLogins } = data;

  const subChart = [
    { name: 'Essai', count: stats.trialSubscriptions },
    { name: 'Actif', count: stats.activeSubscriptions },
    { name: 'Expiré', count: stats.expiredSubscriptions },
    { name: 'Suspendu', count: stats.suspendedSubscriptions },
  ];

  const companyChartData = (companies || []).slice(0, 10).map((c: any) => ({
    name: c.name?.substring(0, 12) || '?',
    users: c._count?.users || 0,
  }));

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Administration</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Entreprises" value={stats.totalCompanies} icon={<Business />} color={theme.palette.primary.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Utilisateurs" value={stats.totalUsers} icon={<People />} color={COLORS.success} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Revenus" value={`${(stats.totalRevenue || 0).toLocaleString('fr-FR')} FCFA`} icon={<AttachMoney />} color={COLORS.cyan} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Syncs" value={0} icon={<Sync />} color={COLORS.purple} />
        </Grid>
      </Grid>

      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Hébergements</Typography>
              {subChart.some(s => s.count > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                    <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Hébergements">
                      {subChart.map((_, index) => (
                        <Cell key={index} fill={BAR_COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">Aucune donnée</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                {subChart.map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: BAR_COLORS[i] }} />
                    <Typography variant="caption">{s.name} ({s.count})</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Entreprises (top 10)</Typography>
              {companyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={companyChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                    <Bar dataKey="users" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} name="Utilisateurs" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">Aucune entreprise créée</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Connexions récentes</Typography>
              {(recentLogins || []).length > 0 ? recentLogins.slice(0, 8).map((login: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{login.firstName} {login.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{login.company?.name || 'Plateforme'}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(login.lastLoginAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              )) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">Aucune connexion</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
