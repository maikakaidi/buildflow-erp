import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Chip, Button, Skeleton } from '@mui/material';
import { ArrowBack, GetApp } from '@mui/icons-material';
import { generatePdf, downloadPdf, formatPdfDate } from '../../../utils/pdf';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/client';

export default function EmployeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [employe, setEmploye] = useState<any>(null);
  const [presences, setPresences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/modules/employees/${id}`),
      api.get('/modules/presences', { limit: 500 }),
      api.get('/modules/contracts', { limit: 200 }),
    ]).then(([eRes, pRes, cRes]) => {
      if (eRes.data.success) setEmploye(eRes.data.data);
      if (pRes.data.success) setPresences(pRes.data.data.items.filter((p: any) => p.employeeId === id));
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePdf = () => {
    if (!employe) return;
    const taux = presences.length > 0 ? Math.round((presences.filter((p: any) => p.status === 'PRESENT').length / presences.length) * 100) : 0;
    const doc = generatePdf({
      title: `Fiche employé: ${employe.firstName} ${employe.lastName}`,
      companyName: company?.name,
      companyLogo: company?.logo,
      primaryColor: company?.primaryColor,
      columns: [
        { header: 'Info', dataKey: 'label' },
        { header: 'Valeur', dataKey: 'value' },
      ],
      data: [
        { label: 'Nom', value: `${employe.firstName} ${employe.lastName}` },
        { label: 'Téléphone', value: `${employe.phoneCode || ''} ${employe.phone || '—'}` },
        { label: 'Email', value: employe.email || '—' },
        { label: 'Poste', value: employe.poste || employe.role || '—' },
        { label: 'Salaire', value: `${employe.salary || 0} FCFA` },
        { label: 'Présences', value: `${presences.filter((p: any) => p.status === 'PRESENT').length}/${presences.length}` },
        { label: 'Taux présence', value: `${taux}%` },
        { label: 'Actif', value: employe.isActive ? 'Oui' : 'Non' },
      ],
      footer: `${company?.name || 'BuildFlow ERP'} — Fiche employé`,
    });
    downloadPdf(doc, `employe-${employe.firstName}-${employe.lastName}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <Box p={3}><Skeleton height={200} /></Box>;
  if (!employe) return <Typography p={3}>Employé introuvable</Typography>;

  const presentes = presences.filter((p: any) => p.status === 'PRESENT').length;
  const absences = presences.filter((p: any) => p.status === 'ABSENT').length;
  const taux = presences.length > 0 ? Math.round((presentes / presences.length) * 100) : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/employees')}>Retour</Button>
        <Box flex={1} />
        <Button variant="contained" startIcon={<GetApp />} onClick={handlePdf}>Exporter PDF</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700}>{employe.firstName} {employe.lastName}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip label={employe.poste || employe.role || 'Employé'} size="small" color="primary" />
            <Chip label={employe.isActive ? 'Actif' : 'Inactif'} size="small" color={employe.isActive ? 'success' : 'default'} />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Informations</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Téléphone</Typography><Typography variant="body2">{employe.phoneCode || ''} {employe.phone || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Email</Typography><Typography variant="body2">{employe.email || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Salaire</Typography><Typography variant="body2" fontWeight={600}>{employe.salary || 0} FCFA</Typography>
              <Typography variant="body2" color="text.secondary">Date embauche</Typography><Typography variant="body2">{employe.hireDate ? new Date(employe.hireDate).toLocaleDateString('fr-FR') : '—'}</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Présences ({presences.length})</Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Box><Typography variant="h4" color="success.main" fontWeight={700}>{presentes}</Typography><Typography variant="caption" color="text.secondary">Présents</Typography></Box>
              <Box><Typography variant="h4" color="error.main" fontWeight={700}>{absences}</Typography><Typography variant="caption" color="text.secondary">Absences</Typography></Box>
              <Box><Typography variant="h4" fontWeight={700}>{taux}%</Typography><Typography variant="caption" color="text.secondary">Taux</Typography></Box>
            </Box>
            {presences.slice(0, 5).map((p: any) => (
              <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2">{new Date(p.date).toLocaleDateString('fr-FR')}</Typography>
                <Chip label={p.status === 'PRESENT' ? 'Présent' : 'Absent'} size="small" color={p.status === 'PRESENT' ? 'success' : 'error'} />
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
