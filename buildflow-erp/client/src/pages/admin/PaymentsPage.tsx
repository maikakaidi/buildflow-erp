import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Skeleton,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import api from '../../api/client';

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    amount: 80000,
    duration: 365,
    currency: 'FCFA',
    instructions: '',
    methods: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/super-admin/payments');
      if (res.success && res.data.length > 0) {
        const p = res.data[0];
        setForm({ amount: p.amount, duration: p.duration, currency: p.currency, instructions: p.instructions || '', methods: p.methods || [] });
        setPayments(res.data);
      } else {
        setForm({
          amount: 80000,
          duration: 365,
          currency: 'FCFA',
          instructions: "Effectuez le paiement sur l'un des comptes suivants :\n\nMoov (Flooz) : 99293329\nAirtel (Money) : 92666942\n\nEnvoyez une capture d'écran après le paiement.",
          methods: ['Moov', 'Airtel'],
        });
      }
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/super-admin/payments', form);
      toast.success('Paramètres de paiement sauvegardés');
    } catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />;

  return (
    <Box>
      <PageHeader title="Paramètres de paiement" subtitle="Configurer les tarifs et numéros de paiement" onRefresh={load} />

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Montant hébergement (FCFA)" value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Durée (jours)" value={form.duration}
                onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Instructions de paiement" multiline rows={8} value={form.instructions}
                onChange={e => setForm({ ...form, instructions: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
                Sauvegarder
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
