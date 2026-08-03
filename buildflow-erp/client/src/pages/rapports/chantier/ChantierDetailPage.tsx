import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Chip, Button, Skeleton } from '@mui/material';
import { ArrowBack, GetApp } from '@mui/icons-material';
import { generatePdf, downloadPdf, formatPdfAmount } from '../../../utils/pdf';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/client';

const TYPE_LABELS: Record<string, string> = { VILLA: 'Villa', ROUTE: 'Route', PONT: 'Pont', MUR: 'Mur', VOIRIE: 'Voirie', CASERNE: 'Caserne', CAMP_MILITAIRE: 'Camp militaire', BATIMENT_ADMINISTRATIF: 'Bâtiment administratif', REHABILITATION: 'Réhabilitation', GENIE_CIVIL: 'Génie Civil' };
const STATUS_LABELS: Record<string, string> = { EN_ATTENTE: 'En attente', EN_COURS: 'En cours', EN_PAUSE: 'En pause', TERMINE: 'Terminé', ANNULE: 'Annulé' };

export default function ChantierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [chantier, setChantier] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/modules/chantiers/${id}`),
      api.get('/modules/employees', { limit: 200 }),
      api.get('/modules/expenses', { limit: 500 }),
    ]).then(([cRes, eRes, exRes]) => {
      if (cRes.data.success) setChantier(cRes.data.data);
      if (eRes.data.success) setEmployees(eRes.data.data.items.filter((e: any) => e.chantierId === id));
      if (exRes.data.success) setExpenses(exRes.data.data.items.filter((ex: any) => ex.chantierId === id));
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePdf = async () => {
    if (!chantier) return;
    const doc = await generatePdf({
      title: `Chantier: ${chantier.name}`,
      subtitle: `Code: ${chantier.code || '—'} | ${STATUS_LABELS[chantier.status] || chantier.status}`,
      companyName: company?.name,
      companyLogo: company?.logo,
      primaryColor: company?.primaryColor,
      columns: [
        { header: 'Info', dataKey: 'label' },
        { header: 'Valeur', dataKey: 'value' },
      ],
      data: [
        { label: 'Type', value: TYPE_LABELS[chantier.type] || chantier.type },
        { label: 'Responsable', value: chantier.responsable || '—' },
        { label: 'Adresse', value: chantier.address || '—' },
        { label: 'Budget', value: formatPdfAmount(chantier.budget || 0) },
        { label: 'Employés', value: String(employees.length) },
        { label: 'Dépenses', value: formatPdfAmount(expenses.reduce((s: number, e: any) => s + e.amount, 0)) },
        { label: 'Début', value: chantier.startDate ? new Date(chantier.startDate).toLocaleDateString('fr-FR') : '—' },
        { label: 'Fin', value: chantier.endDate ? new Date(chantier.endDate).toLocaleDateString('fr-FR') : '—' },
      ],
      footer: `${company?.name || 'BuildFlow ERP'} — Fiche chantier`,
    });
    downloadPdf(doc, `chantier-${chantier.code || chantier.id}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <Box p={3}><Skeleton height={200} /><Skeleton height={100} sx={{ mt: 2 }} /></Box>;
  if (!chantier) return <Typography p={3}>Chantier introuvable</Typography>;

  const totalDepenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/chantiers')}>Retour</Button>
        <Box flex={1} />
        <Button variant="contained" startIcon={<GetApp />} onClick={handlePdf}>Exporter PDF</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700}>{chantier.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip label={STATUS_LABELS[chantier.status] || chantier.status} size="small" color="primary" />
            <Chip label={TYPE_LABELS[chantier.type] || chantier.type} size="small" variant="outlined" />
            {chantier.code && <Chip label={chantier.code} size="small" variant="outlined" />}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Informations</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Responsable</Typography><Typography variant="body2">{chantier.responsable || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Adresse</Typography><Typography variant="body2">{chantier.address || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Budget</Typography><Typography variant="body2" fontWeight={600}>{formatPdfAmount(chantier.budget || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">Dépenses</Typography><Typography variant="body2" fontWeight={600} color="error.main">{formatPdfAmount(totalDepenses)}</Typography>
              <Typography variant="body2" color="text.secondary">Début</Typography><Typography variant="body2">{chantier.startDate ? new Date(chantier.startDate).toLocaleDateString('fr-FR') : '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Fin</Typography><Typography variant="body2">{chantier.endDate ? new Date(chantier.endDate).toLocaleDateString('fr-FR') : '—'}</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Employés ({employees.length})</Typography>
            {employees.length === 0 ? <Typography variant="body2" color="text.secondary">Aucun employé</Typography> :
              employees.slice(0, 10).map((e: any) => (
                <Box key={e.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2">{e.firstName} {e.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{e.poste || e.role || '—'}</Typography>
                </Box>
              ))}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
