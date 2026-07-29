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
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)} 0%, ${theme.palette.background.default} 50%, ${alpha(theme.palette.secondary.dark, 0.2)} 100%)`,
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, p: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}
            >
              <Construction sx={{ fontSize: 36, color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="h4" fontWeight={700}>BuildFlow ERP</Typography>
            <Typography color="text.secondary" mt={0.5}>Connectez-vous à votre espace</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Indicatif"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                sx={{ width: 100 }}
                size="small"
              />
              <TextField
                label="Téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment>
                  ),
                }}
              />
            </Box>

            <TextField
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2" color="primary">
                Créer une entreprise
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
