import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Skeleton, Avatar, Typography, alpha, useTheme,
} from '@mui/material';
import { Add, Edit, LockReset, People, ToggleOff, ToggleOn, Delete, Save, GroupAdd } from '@mui/icons-material';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import api from '../../api/client';

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];

export default function SuperAdminUsersPage() {
  const theme = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [savingLimit, setSavingLimit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', phoneCode: '+227', password: '', role: 'EMPLOYEE', companyId: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, dashRes] = await Promise.all([
        api.get('/super-admin/users'),
        api.get('/super-admin/dashboard'),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (dashRes.data.success) setCompanies(dashRes.data.data.companies || []);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setLimits((prev) => {
      const next: Record<string, string> = { ...prev };
      companies.forEach((c: any) => {
        if (c.id && next[c.id] === undefined) next[c.id] = String(c.maxUsers ?? 3);
      });
      return next;
    });
  }, [companies]);

  const handleSaveLimit = async (companyId: string) => {
    const value = parseInt(limits[companyId] || '3', 10);
    if (isNaN(value) || value < 1) return toast.error('Limite invalide');
    setSavingLimit(companyId);
    try {
      await api.put(`/super-admin/companies/${companyId}`, { maxUsers: value });
      toast.success('Limite mise à jour');
      setCompanies((prev) => prev.map((c: any) => c.id === companyId ? { ...c, maxUsers: value } : c));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSavingLimit(null); }
  };

  const userCountByCompany = users.reduce<Record<string, number>>((acc, u: any) => {
    if (u.companyId) acc[u.companyId] = (acc[u.companyId] || 0) + 1;
    return acc;
  }, {});

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.password || !form.companyId) {
      return toast.error('Remplissez les champs requis');
    }
    setSaving(true);
    try {
      await api.post('/super-admin/users', form);
      toast.success('Utilisateur créé');
      setDialogOpen(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', phoneCode: '+227', password: '', role: 'EMPLOYEE', companyId: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleResetPassword = async (userId: string, name: string) => {
    if (!confirm(`Réinitialiser le mot de passe de ${name} ?`)) return;
    try {
      const { data: res } = await api.post(`/super-admin/users/${userId}/reset-password`);
      if (res.success) {
        toast.success(`Nouveau mot de passe: ${res.data.tempPassword}`, { duration: 10000 });
      }
    } catch { toast.error('Erreur'); }
  };

  return (
    <Box>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} utilisateur(s)`}
        action={{ label: 'Nouveau', onClick: () => setDialogOpen(true) }}
        onRefresh={load}
      />

      {loading ? (
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Entreprise</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Dernière connexion</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main, width: 36, height: 36, fontSize: 14 }}>
                          {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.phoneCode}{u.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={u.isSuperAdmin ? 'Super Admin' : u.role} size="small"
                        color={u.isSuperAdmin ? 'error' : u.role === 'ADMIN' ? 'primary' : 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell>{u.company?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={u.isActive ? 'Actif' : 'Inactif'} size="small" color={u.isActive ? 'success' : 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
                    </TableCell>
                    <TableCell align="right">
                      {!u.isSuperAdmin && (
                        <>
                          <Tooltip title={u.isActive ? 'Désactiver' : 'Activer'}>
                            <IconButton size="small" color={u.isActive ? 'warning' : 'success'} onClick={async () => {
                              try { await api.put(`/super-admin/users/${u.id}`, { isActive: !u.isActive }); toast.success(u.isActive ? 'Désactivé' : 'Activé'); load(); } catch { toast.error('Erreur'); }
                            }}>
                              {u.isActive ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Réinitialiser mot de passe">
                            <IconButton size="small" color="warning" onClick={() => handleResetPassword(u.id, `${u.firstName} ${u.lastName}`)}>
                              <LockReset fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" color="error" onClick={async () => {
                              if (!confirm(`Supprimer ${u.firstName} ${u.lastName} ?`)) return;
                              try { await api.delete(`/super-admin/users/${u.id}`); toast.success('Supprimé'); load(); } catch { toast.error('Erreur'); }
                            }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <People sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary">Aucun utilisateur</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {!loading && companies.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupAdd color="primary" />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Limite d'utilisateurs par entreprise</Typography>
              <Typography variant="caption" color="text.secondary">
                Nombre maximum d'utilisateurs actifs autorisés avant facturation (20 000 FCFA / extra).
              </Typography>
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Entreprise</TableCell>
                  <TableCell align="center">Utilisateurs actifs</TableCell>
                  <TableCell align="center">Limite max</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((c: any) => {
                  const current = userCountByCompany[c.id] || 0;
                  const limit = parseInt(limits[c.id] || String(c.maxUsers ?? 3), 10);
                  const atLimit = current >= limit;
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${current}`} size="small" color={atLimit ? 'warning' : 'success'} variant="outlined" />
                      </TableCell>
                      <TableCell align="center" sx={{ width: 160 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={limits[c.id] ?? String(c.maxUsers ?? 3)}
                          onChange={(e) => setLimits({ ...limits, [c.id]: e.target.value })}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Enregistrer la limite">
                          <IconButton size="small" color="primary" disabled={savingLimit === c.id} onClick={() => handleSaveLimit(c.id)}>
                            {savingLimit === c.id ? <Skeleton width={18} /> : <Save fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvel utilisateur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Prénom *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Téléphone *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Mot de passe *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Rôle" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Entreprise *" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}>
                {companies.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>Créer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
