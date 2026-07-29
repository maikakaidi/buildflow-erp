import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Chip, Button, Skeleton } from '@mui/material';
import { ArrowBack, GetApp } from '@mui/icons-material';
import { generatePdf, downloadPdf, formatPdfAmount, formatPdfDate } from '../../../utils/pdf';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/client';

export default function VehiculeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [vehicule, setVehicule] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/modules/vehicles/${id}`),
      api.get('/modules/locations', { limit: 500 }),
    ]).then(([vRes, lRes]) => {
      if (vRes.data.success) setVehicule(vRes.data.data);
      if (lRes.data.success) setLocations(lRes.data.data.items.filter((l: any) => l.vehicleId === id));
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePdf = () => {
    if (!vehicule) return;
    const totalLocation = locations.reduce((s: number, l: any) => s + (l.totalAmount || 0), 0);
    const doc = generatePdf({
      title: `Fiche véhicule: ${vehicule.brand} ${vehicule.model}`,
      subtitle: `Plaque: ${vehicule.plateNumber}`,
      companyName: company?.name,
      companyLogo: company?.logo,
      primaryColor: company?.primaryColor,
      columns: [
        { header: 'Info', dataKey: 'label' },
        { header: 'Valeur', dataKey: 'value' },
      ],
      data: [
        { label: 'Marque', value: vehicule.brand },
        { label: 'Modèle', value: vehicule.model },
        { label: 'Plaque', value: vehicule.plateNumber },
        { label: 'Année', value: String(vehicule.year || '—') },
        { label: 'Type carburant', value: vehicule.fuelType || '—' },
        { label: 'Kilométrage', value: `${vehicule.currentMileage || 0} km` },
        { label: 'Assurance expire', value: vehicule.insuranceExpiry ? formatPdfDate(vehicule.insuranceExpiry) : '—' },
        { label: 'Total locations', value: formatPdfAmount(totalLocation) },
        { label: 'Nb locations', value: String(locations.length) },
      ],
      footer: `${company?.name || 'BuildFlow ERP'} — Fiche véhicule`,
    });
    downloadPdf(doc, `vehicule-${vehicule.plateNumber}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <Box p={3}><Skeleton height={200} /></Box>;
  if (!vehicule) return <Typography p={3}>Véhicule introuvable</Typography>;

  const totalLocation = locations.reduce((s: number, l: any) => s + (l.totalAmount || 0), 0);
  const activeLocations = locations.filter((l: any) => l.status === 'active');

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/vehicles')}>Retour</Button>
        <Box flex={1} />
        <Button variant="contained" startIcon={<GetApp />} onClick={handlePdf}>Exporter PDF</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700}>{vehicule.brand} {vehicule.model}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip label={vehicule.plateNumber} size="small" color="primary" />
            <Chip label={vehicule.fuelType || '—'} size="small" variant="outlined" />
            <Chip label={vehicule.isActive ? 'Actif' : 'Inactif'} size="small" color={vehicule.isActive ? 'success' : 'default'} />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Caractéristiques</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Année</Typography><Typography variant="body2">{vehicule.year || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Kilométrage</Typography><Typography variant="body2">{vehicule.currentMileage || 0} km</Typography>
              <Typography variant="body2" color="text.secondary">Assurance</Typography><Typography variant="body2">{vehicule.insuranceExpiry ? formatPdfDate(vehicule.insuranceExpiry) : '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Visite technique</Typography><Typography variant="body2">{vehicule.technicalVisit ? formatPdfDate(vehicule.technicalVisit) : '—'}</Typography>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Locations ({locations.length})</Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Box><Typography variant="h4" fontWeight={700}>{locations.length}</Typography><Typography variant="caption" color="text.secondary">Total</Typography></Box>
              <Box><Typography variant="h4" color="warning.main" fontWeight={700}>{activeLocations.length}</Typography><Typography variant="caption" color="text.secondary">En cours</Typography></Box>
              <Box><Typography variant="h4" color="success.main" fontWeight={700}>{formatPdfAmount(totalLocation)}</Typography><Typography variant="caption" color="text.secondary">Chiffre</Typography></Box>
            </Box>
            {locations.slice(0, 5).map((l: any) => (
              <Box key={l.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography variant="body2">{l.clientName || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{l.destination || ''}</Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>{formatPdfAmount(l.totalAmount || 0)}</Typography>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
