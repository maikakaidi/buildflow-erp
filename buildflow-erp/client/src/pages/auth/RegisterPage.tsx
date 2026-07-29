import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Link,
  Alert, Stepper, Step, StepLabel, InputAdornment, IconButton,
  CircularProgress, Grid, useTheme, alpha,
} from '@mui/material';
import { Visibility, VisibilityOff, Phone, Lock, Business, Person, Construction, CheckCircle, Payment } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const steps = ['Entreprise', 'Directeur', 'Sécurité'];

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    companySlug: '',
    country: 'Niger',
    directorFirstName: '',
    directorLastName: '',
    directorEmail: '',
    phoneCode: '+227',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNext = () => {
    if (activeStep === 0 && (!form.companyName || !form.companySlug)) {
      setError('Nom et slug de l\'entreprise requis');
      return;
    }
    if (activeStep === 1 && (!form.directorFirstName || !form.directorLastName || !form.phone)) {
      setError('Informations du directeur requises');
      return;
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      setRegistered(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <Box
        sx={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)} 0%, ${theme.palette.background.default} 50%, ${alpha(theme.palette.secondary.dark, 0.2)} 100%)`,
          p: 2,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 560, p: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={700}>Compte créé avec succès !</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Votre entreprise <strong>{form.companyName}</strong> est enregistrée.
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography fontWeight={600} gutterBottom>Offre d'essai : 30 jours gratuits</Typography>
              <Typography variant="body2">
                Vous bénéficiez de 30 jours d'essai pour découvrir toutes les fonctionnalités de BuildFlow ERP.
              </Typography>
            </Alert>

            <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, p: 3, mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Payment color="primary" />
                <Typography variant="h6" fontWeight={700} color="primary">
                  Activer votre hébergement annuel
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Pour continuer à utiliser BuildFlow ERP après la période d'essai, souscrivez à l'hébergement annuel pour <strong>80 000 FCFA/an</strong>.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Contactez-nous via WhatsApp pour effectuer votre paiement :
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  component="a"
                  href="https://wa.me/22799293329"
                  target="_blank"
                  startIcon={<Phone />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Nita (Moov) — 99 29 33 29</Typography>
                    <Typography variant="caption" color="text.secondary">Envoyer le preuve de paiement via WhatsApp</Typography>
                  </Box>
                </Button>
                <Button
                  variant="outlined"
                  component="a"
                  href="https://wa.me/22792666942"
                  target="_blank"
                  startIcon={<Phone />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Amana (Airtel) — 92 66 69 42</Typography>
                    <Typography variant="caption" color="text.secondary">Envoyer le preuve de paiement via WhatsApp</Typography>
                  </Box>
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Après paiement, envoyez la capture d'écran sur WhatsApp. Votre hébergement sera activé dans les plus brefs délais.
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/login')}
              size="large"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)} 0%, ${theme.palette.background.default} 50%, ${alpha(theme.palette.secondary.dark, 0.2)} 100%)`,
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 560, p: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
              <Construction sx={{ fontSize: 30, color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>Créer votre entreprise</Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Nom de l'entreprise" value={form.companyName} onChange={(e) => { update('companyName', e.target.value); update('companySlug', generateSlug(e.target.value)); }} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Business fontSize="small" /></InputAdornment> }} />
                <TextField label="Identifiant (slug)" value={form.companySlug} onChange={(e) => update('companySlug', e.target.value)} required size="small" helperText="ex: mon-entreprise" />
                <TextField label="Pays" value={form.country} onChange={(e) => update('country', e.target.value)} size="small" />
                <TextField label="Adresse" value={form.address} onChange={(e) => update('address', e.target.value)} size="small" />
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField label="Prénom" value={form.directorFirstName} onChange={(e) => update('directorFirstName', e.target.value)} required size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Nom" value={form.directorLastName} onChange={(e) => update('directorLastName', e.target.value)} required size="small" fullWidth />
                  </Grid>
                </Grid>
                <TextField label="Email" type="email" value={form.directorEmail} onChange={(e) => update('directorEmail', e.target.value)} size="small" />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField label="Indicatif" value={form.phoneCode} onChange={(e) => update('phoneCode', e.target.value)} size="small" sx={{ width: 100 }} />
                  <TextField label="Téléphone" value={form.phone} onChange={(e) => update('phone', e.target.value)} required size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Mot de passe" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} size="small">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
                <TextField label="Confirmer le mot de passe" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required size="small" />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {activeStep > 0 && <Button onClick={() => setActiveStep((prev) => prev - 1)}>Retour</Button>}
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext} sx={{ ml: 'auto' }}>Suivant</Button>
              ) : (
                <Button type="submit" variant="contained" disabled={loading} sx={{ ml: 'auto' }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Créer l\'entreprise'}
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2" color="primary">
                Déjà un compte ? Se connecter
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
