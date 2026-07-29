import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { GetApp, Warning } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { generatePdf, downloadPdf, formatPdfAmount } from '../../utils/pdf';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function RapportStockPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/modules/stock-items', { limit: 1000 }),
      api.get('/modules/stock-movements', { limit: 2000 }),
    ]).then(([i, m]) => {
      if (i.data.success) setItems(i.data.data.items);
      if (m.data.success) setMovements(m.data.data.items);
    }).finally(() => setLoading(false));
  }, []);

  const lowStock = items.filter((i: any) => i.quantity <= (i.minQuantity || 0));
  const valeurStock = items.reduce((s: number, i: any) => s + (i.quantity || 0) * (i.price || 0), 0);
  const entrees = movements.filter((m: any) => m.type === 'ENTREE').reduce((s: number, m: any) => s + (m.quantity || 0), 0);
  const sorties = movements.filter((m: any) => m.type === 'SORTIE').reduce((s: number, m: any) => s + (m.quantity || 0), 0);

  const handlePdf = () => {
    const doc = generatePdf({
      title: 'Rapport de stock',
      subtitle: `${items.length} article(s), ${lowStock.length} alerte(s)`,
      companyName: company?.name,
      companyLogo: company?.logo,
      primaryColor: company?.primaryColor,
      orientation: 'landscape',
      columns: [
        { header: 'Article', dataKey: 'article' },
        { header: 'Qté', dataKey: 'quantite', align: 'right' },
        { header: 'Seuil', dataKey: 'seuil', align: 'right' },
        { header: 'Prix unitaire', dataKey: 'prix', align: 'right' },
        { header: 'Valeur', dataKey: 'valeur', align: 'right' },
        { header: 'Emplacement', dataKey: 'emplacement' },
      ],
      data: items.map((i: any) => ({
        article: `${i.code} — ${i.name}`,
        quantite: i.quantity,
        seuil: i.minQuantity || 0,
        prix: i.price || 0,
        valeur: (i.quantity || 0) * (i.price || 0),
        emplacement: i.location || '—',
      })),
      footer: `${company?.name || 'BuildFlow ERP'} — Rapport de stock`,
    });
    downloadPdf(doc, `rapport-stock-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Box>
      <PageHeader title="Rapport de stock" subtitle={`${items.length} article(s)`}
        action={{ label: 'Exporter PDF', icon: <GetApp />, onClick: handlePdf }}
        onRefresh={() => window.location.reload()}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Articles</Typography><Typography variant="h5" fontWeight={700}>{items.length}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Alertes stock</Typography><Typography variant="h5" fontWeight={700} color="warning.main">{lowStock.length}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Valeur stock</Typography><Typography variant="h5" fontWeight={700} color="success.main">{formatPdfAmount(valeurStock)}</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Mouvements</Typography><Typography variant="h5" fontWeight={700}>{entrees}E / {sorties}S</Typography></CardContent></Card></Grid>
      </Grid>

      <Grid container spacing={2}>
        {lowStock.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ borderColor: 'warning.main' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2} color="warning.main"><Warning sx={{ mr: 1, verticalAlign: 'middle' }} />Alertes stock faible ({lowStock.length})</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Article</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Seuil</TableCell>
                        <TableCell>Emplacement</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStock.map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell><Typography variant="body2" fontWeight={500}>{i.name}</Typography></TableCell>
                          <TableCell align="right"><Chip label={i.quantity} size="small" color="warning" /></TableCell>
                          <TableCell align="right">{i.minQuantity || 0}</TableCell>
                          <TableCell>{i.location || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>État du stock</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Article</TableCell>
                      <TableCell align="right">Qté</TableCell>
                      <TableCell align="right">Seuil</TableCell>
                      <TableCell align="right">Prix unitaire</TableCell>
                      <TableCell align="right">Valeur</TableCell>
                      <TableCell>Emplacement</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((i: any) => {
                      const isLow = i.quantity <= (i.minQuantity || 0);
                      return (
                        <TableRow key={i.id} sx={{ bgcolor: isLow ? 'rgba(255,152,0,0.08)' : 'transparent' }}>
                          <TableCell><Chip label={i.code} size="small" variant="outlined" /></TableCell>
                          <TableCell><Typography variant="body2" fontWeight={500}>{i.name}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" color={isLow ? 'warning.main' : 'text.primary'} fontWeight={600}>{i.quantity}</Typography></TableCell>
                          <TableCell align="right">{i.minQuantity || 0}</TableCell>
                          <TableCell align="right">{formatPdfAmount(i.price || 0)}</TableCell>
                          <TableCell align="right">{formatPdfAmount((i.quantity || 0) * (i.price || 0))}</TableCell>
                          <TableCell>{i.location || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
