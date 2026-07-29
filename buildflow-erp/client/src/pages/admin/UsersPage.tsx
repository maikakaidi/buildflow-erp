import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Skeleton, Avatar, Typography, alpha, useTheme,
} from '@mui/material';
import { Add, Edit, LockReset, People } from '@mui/icons-material';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import api from '../../api/client';

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];

export default function SuperAdminUsersPage() {
  const theme = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
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
                        <Tooltip title="Réinitialiser mot de passe">
                          <IconButton size="small" color="warning" onClick={() => handleResetPassword(u.id, `${u.firstName} ${u.lastName}`)}>
                            <LockReset fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
