import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Grid, Button, Switch,
  FormControlLabel, Divider, Avatar, useTheme, alpha, CircularProgress, Tabs, Tab,
} from '@mui/material';
import { Save as SaveIcon, Business, Palette, Receipt } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import FileUpload from '../../components/common/FileUpload';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const theme = useTheme();
  const { company, refreshUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState<any>({});
  const [settingsData, setSettingsData] = useState<any>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [companyRes, settingsRes] = await Promise.all([
          api.get('/settings/company'),
          api.get('/settings'),
        ]);
        if (companyRes.data.success) setCompanyData(companyRes.data.data);
        if (settingsRes.data.success) setSettingsData(settingsRes.data.data || {});
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    loadSettings();
  }, []);

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await api.put('/settings/company', companyData);
      await refreshUser();
      toast.success('Entreprise mise à jour');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settingsData);
      toast.success('Paramètres sauvegardés');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const updateCompany = (field: string, value: any) => setCompanyData((prev: any) => ({ ...prev, [field]: value }));
  const updateSettings = (field: string, value: any) => setSettingsData((prev: any) => ({ ...prev, [field]: value }));

  return (
    <Box>
      <PageHeader title="Paramètres" subtitle="Configuration de votre entreprise" />

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Business />} iconPosition="start" label="Entreprise" />
          <Tab icon={<Palette />} iconPosition="start" label="Apparence" />
          <Tab icon={<Receipt />} iconPosition="start" label="Documents" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nom" value={companyData.name || ''} onChange={(e) => updateCompany('name', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" value={companyData.email || ''} onChange={(e) => updateCompany('email', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Pays" value={companyData.country || ''} onChange={(e) => updateCompany('country', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Téléphone" value={companyData.phone || ''} onChange={(e) => updateCompany('phone', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Devise" value={companyData.currency || 'FCFA'} onChange={(e) => updateCompany('currency', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Adresse" value={companyData.address || ''} onChange={(e) => updateCompany('address', e.target.value)} fullWidth size="small" multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nom du directeur" value={companyData.directorName || ''} onChange={(e) => updateCompany('directorName', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Fuseau horaire" value={companyData.timezone || 'Africa/Ndjamena'} onChange={(e) => updateCompany('timezone', e.target.value)} fullWidth size="small" />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Images</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FileUpload label="Logo" value={companyData.logo || null} onChange={(url) => updateCompany('logo', url)} type="image" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FileUpload label="Signature" value={companyData.signature || null} onChange={(url) => updateCompany('signature', url)} type="image" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FileUpload label="Cachet" value={companyData.stamp || null} onChange={(url) => updateCompany('stamp', url)} type="image" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FileUpload label="Logo PDF" value={companyData.logoPdf || null} onChange={(url) => updateCompany('logoPdf', url)} type="image" />
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />} onClick={handleSaveCompany} disabled={saving}>
                  Enregistrer
                </Button>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Couleur principale" value={companyData.primaryColor || '#1976D2'} onChange={(e) => updateCompany('primaryColor', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Couleur secondaire" value={companyData.secondaryColor || '#DC004E'} onChange={(e) => updateCompany('secondaryColor', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />} onClick={handleSaveCompany} disabled={saving}>
                  Enregistrer
                </Button>
              </Grid>
            </Grid>
          )}

          {tab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="Préfixe facture" value={settingsData.invoicePrefix || 'FAC'} onChange={(e) => updateSettings('invoicePrefix', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Préfixe devis" value={settingsData.quotePrefix || 'DEV'} onChange={(e) => updateSettings('quotePrefix', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Préfixe bon de commande" value={settingsData.orderPrefix || 'BC'} onChange={(e) => updateSettings('orderPrefix', e.target.value)} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Taux TVA (%)" type="number" value={settingsData.taxRate || 0} onChange={(e) => updateSettings('taxRate', parseFloat(e.target.value))} fullWidth size="small" />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />} onClick={handleSaveCompany} disabled={saving}>
                  Enregistrer
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Hébergement & Abonnement</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Pour activer ou renouveler votre abonnement, effectuez un paiement de <strong>80 000 FCFA</strong> par an sur l'un des numéros WhatsApp ci-dessous, puis contactez le support.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={600}>Airtel (Nita)</Typography>
                        <Typography variant="h5" fontWeight={700} color="primary.main">99293329</Typography>
                        <Button size="small" variant="text" href="https://wa.me/22799293329" target="_blank" sx={{ mt: 1 }}>
                          Envoyer sur WhatsApp
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={600}>Orange (Amana)</Typography>
                        <Typography variant="h5" fontWeight={700} color="secondary.main">92666942</Typography>
                        <Button size="small" variant="text" href="https://wa.me/22792666942" target="_blank" sx={{ mt: 1 }}>
                          Envoyer sur WhatsApp
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
