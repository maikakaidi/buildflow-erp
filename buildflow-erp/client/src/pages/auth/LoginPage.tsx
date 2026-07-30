import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Link,
  Alert, InputAdornment, IconButton, CircularProgress, useTheme, alpha,
} from '@mui/material';
import { Visibility, VisibilityOff, Phone, Lock, Construction } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phoneCode, setPhoneCode] = useState('+227');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result: any = await login(phoneCode, phone, password);
      navigate(result?.user?.isSuperAdmin ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.35)} 0%, ${theme.palette.background.default} 50%, ${alpha(theme.palette.secondary.dark, 0.25)} 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
          top: '-200px', right: '-200px',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
          bottom: '-150px', left: '-150px',
        },
        p: 2,
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 72, height: 72, borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2.5,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Construction sx={{ fontSize: 40, color: '#fff' }} />
          </Box>
          <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>BuildFlow ERP</Typography>
          <Typography color="text.secondary" mt={0.5} fontSize="0.95rem">Connectez-vous à votre espace de gestion</Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: `0 8px 40px ${alpha('#000', 0.3)}` }}>
          <CardContent sx={{ p: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                <TextField label="Indicatif" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} sx={{ width: 100 }} size="small" />
                <TextField label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} required fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
              </Box>

              <TextField label="Mot de passe" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth size="small" sx={{ mb: 3 }} InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>, endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} size="small">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />

              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontSize: '1rem', borderRadius: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nouveau ?{' '}
                  <Link component={RouterLink} to="/register" color="primary" fontWeight={600}>
                    Créer une entreprise
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={3}>
          &copy; {new Date().getFullYear()} BuildFlow ERP. Tous droits réservés.
        </Typography>
      </Box>
    </Box>
  );
}
