import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Skeleton, Avatar, Typography, alpha, useTheme,
} from '@mui/material';
import {
  Add, Edit, Delete, Pause, PlayArrow, Refresh, Business, CloudUpload,
  CalendarMonth, LockReset,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import api from '../../api/client';

const STATUS_COLORS: Record<string, any> = {
  TRIAL: { color: 'warning', label: 'Essai' },
  ACTIVE: { color: 'success', label: 'Actif' },
  EXPIRED: { color: 'error', label: 'Expiré' },
  SUSPENDED: { color: 'default', label: 'Suspendu' },
};

const initialForm = {
  name: '', slug: '', email: '', phone: '', phoneCode: '+227',
  directorFirstName: '', directorLastName: '', country: 'Niger',
  address: '', plan: 'TRIAL', password: '', logo: '',
};

export default function CompaniesPage() {
  const theme = useTheme();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/super-admin/dashboard');
      if (res.success) setCompanies(res.data.companies || []);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: res } = await api.upload('/upload/logo', formData);
      if (res.success) {
        setForm(prev => ({ ...prev, logo: res.data.url }));
        toast.success('Logo uploadé');
      }
    } catch { toast.error("Erreur d'upload"); }
    finally { setUploadingLogo(false); }
  };

  const handleOpen = (company?: any) => {
    if (company) {
      setEditingId(company.id);
      setForm({
        name: company.name || '', slug: company.slug || '', email: company.email || '',
        phone: company.phone?.replace(company.phoneCode || '+227', '') || '',
        phoneCode: company.phoneCode || '+227',
        directorFirstName: company.directorName?.split(' ')[0] || '',
        directorLastName: company.directorName?.split(' ').slice(1).join(' ') || '',
        country: company.country || 'Niger', address: company.address || '',
        plan: company.subscriptions?.[0]?.plan || 'TRIAL', password: '',
        logo: company.logo || '',
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.directorFirstName) {
      return toast.error('Remplissez les champs requis');
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/super-admin/companies/${editingId}`, form);
        toast.success('Entreprise mise à jour');
      } else {
        await api.post('/super-admin/companies', form);
        toast.success('Entreprise créée');
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleSuspend = async (id: string) => {
    try { await api.post(`/super-admin/companies/${id}/suspend`); toast.success('Suspendue'); load(); }
    catch { toast.error('Erreur'); }
  };

  const handleReactivate = async (id: string) => {
    try { await api.post(`/super-admin/companies/${id}/reactivate`); toast.success('Réactivée'); load(); }
    catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    try { await api.delete(`/super-admin/companies/${id}`); toast.success('Supprimée'); load(); }
    catch { toast.error('Erreur'); }
  };

  const handleRenew = async (id: string, days: number = 365) => {
    try { await api.post(`/super-admin/subscriptions/${id}/renew`, { days }); toast.success(`Hébergement activé/renouvelé (${days}j)`); load(); }
    catch { toast.error('Erreur'); }
  };

  const handleAddDays = async (id: string) => {
    const input = prompt('Nombre de jours à ajouter :');
    if (!input) return;
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return toast.error('Nombre invalide');
    try { await api.post(`/super-admin/subscriptions/${id}/add-days`, { days }); toast.success(`${days} jours ajoutés`); load(); }
    catch { toast.error('Erreur'); }
  };

  const handleResetPassword = async (companyId: string) => {
    const users = companies.find(c => c.id === companyId)?._count;
    const companyName = companies.find(c => c.id === companyId)?.name;
    const newPass = prompt(`Réinitialiser le mot de passe admin de "${companyName}" ?\n\nEntrez le nouveau mot de passe :`);
    if (!newPass) return;
    try {
      await api.post(`/super-admin/users`, { companyId, firstName: 'Admin', lastName: companyName, phone: '000000', phoneCode: '+227', password: newPass, role: 'ADMIN' });
      toast.success(`Mot de passe réinitialisé`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/227${cleaned}`, '_blank');
  };

  return (
    <Box>
      <PageHeader title="Entreprises" subtitle={`${companies.length} entreprise(s)`}
        action={{ label: 'Nouvelle', onClick: () => handleOpen() }} onRefresh={load} />

      {loading ? (
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Entreprise</TableCell>
                  <TableCell>Directeur</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Utilisateurs</TableCell>
                  <TableCell>Hébergement</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((c: any) => {
                  const sub = c.subscriptions?.[0];
                  const status = STATUS_COLORS[sub?.status || 'TRIAL'] || STATUS_COLORS.TRIAL;
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={c.logo || undefined}
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main, width: 36, height: 36, fontSize: 14 }}>
                            {c.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                            <Typography variant="caption" color="text.secondary">/{c.slug}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{c.directorName || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.email || '-'}</Typography>
                        <Button size="small" variant="text" color="success" onClick={() => openWhatsApp(c.phone || '')}
                          sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.75rem' }}>
                          {c.phone || ''}
                        </Button>
                      </TableCell>
                      <TableCell><Chip label={c._count?.users || 0} size="small" color="primary" variant="outlined" /></TableCell>
                      <TableCell>
                        <Chip label={status.label} size="small" color={status.color} variant="outlined" />
                        <Typography variant="caption" color="text.secondary" display="block">{sub?.plan === 'PAID' ? 'Hébergé' : sub?.plan || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        {sub?.endDate ? (
                          <Box>
                            <Typography variant="body2">{new Date(sub.endDate).toLocaleDateString('fr-FR')}</Typography>
                            {(() => {
                              const now = new Date();
                              const end = new Date(sub.endDate);
                              const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                              return (
                                <Typography variant="caption" color={days <= 0 ? 'error' : days <= 30 ? 'warning' : 'success'} fontWeight={600}>
                                  {days <= 0 ? 'Expiré' : `${days}j restant(s)`}
                                </Typography>
                              );
                            })()}
                          </Box>
                        ) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Modifier"><IconButton size="small" onClick={() => handleOpen(c)}><Edit fontSize="small" /></IconButton></Tooltip>
                        {sub?.status === 'SUSPENDED' || sub?.status === 'EXPIRED' || !sub ? (
                          <Tooltip title="Activer hébergement (1an)"><IconButton size="small" color="success" onClick={() => handleRenew(c.id, 365)}><PlayArrow fontSize="small" /></IconButton></Tooltip>
                        ) : (
                          <Tooltip title="Suspendre"><IconButton size="small" color="warning" onClick={() => handleSuspend(c.id)}><Pause fontSize="small" /></IconButton></Tooltip>
                        )}
                        <Tooltip title="Ajouter des jours"><IconButton size="small" color="info" onClick={() => handleAddDays(c.id)}><CalendarMonth fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Réactiver"><IconButton size="small" color="success" onClick={() => handleReactivate(c.id)}><PlayArrow fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => handleDelete(c.id, c.name)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {companies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Business sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary">Aucune entreprise créée</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Modifier' : 'Nouvelle entreprise'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar src={form.logo || undefined}
                  sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.primary.main, 0.15), color: theme.palette.primary.main, fontSize: 28 }}>
                  {form.name?.charAt(0) || '?'}
                </Avatar>
                <Button size="small" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                  {uploadingLogo ? 'Upload...' : 'Logo entreprise'}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom entreprise *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Slug *" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} helperText="identifiant URL" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Prénom directeur *" value={form.directorFirstName} onChange={e => setForm({ ...form, directorFirstName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom directeur *" value={form.directorLastName} onChange={e => setForm({ ...form, directorLastName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Téléphone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Pays" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
                <MenuItem value="Niger">Niger</MenuItem>
                <MenuItem value="Nigeria">Nigeria</MenuItem>
                <MenuItem value="Côte d'Ivoire">Côte d'Ivoire</MenuItem>
                <MenuItem value="Sénégal">Sénégal</MenuItem>
                <MenuItem value="Burkina Faso">Burkina Faso</MenuItem>
                <MenuItem value="Mali">Mali</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Plan" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                <MenuItem value="TRIAL">Essai (30j gratuit)</MenuItem>
                <MenuItem value="PAID">Hébergement annuel</MenuItem>
              </TextField>
            </Grid>
            {!editingId && (
              <Grid item xs={12}>
                <TextField fullWidth label="Mot de passe admin *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth label="Adresse" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{editingId ? 'Mettre à jour' : 'Créer'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
