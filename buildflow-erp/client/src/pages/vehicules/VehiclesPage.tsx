import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { DirectionsBus } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';

const FUEL_OPTIONS = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Essence', label: 'Essence' },
  { value: 'Électrique', label: 'Électrique' },
  { value: 'GPL', label: 'GPL' },
];

const formFields: FormField[] = [
  { name: 'plateNumber', label: 'Immatriculation', required: true, gridSize: 6 },
  { name: 'brand', label: 'Marque', required: true, gridSize: 6 },
  { name: 'model', label: 'Modèle', required: true, gridSize: 6 },
  { name: 'year', label: 'Année', type: 'number', gridSize: 6 },
  { name: 'type', label: 'Type', gridSize: 6 },
  { name: 'fuelType', label: 'Carburant', type: 'select', options: FUEL_OPTIONS, gridSize: 6 },
  { name: 'currentMileage', label: 'Kilométrage', type: 'number', gridSize: 6 },
  { name: 'insuranceExpiry', label: 'Expiration assurance', type: 'date', gridSize: 6 },
  { name: 'technicalVisit', label: 'Visite technique', type: 'date', gridSize: 6 },
];

export default function VehiclesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/vehicles', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/vehicles/${editItem.id}`, formData);
      else await api.post('/modules/vehicles', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/vehicles/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    {
      id: 'plateNumber', label: 'Immatriculation', sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 12, bgcolor: 'warning.dark' }}>
            <DirectionsBus fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{row.plateNumber}</Typography>
            <Typography variant="caption" color="text.secondary">{row.brand} {row.model}</Typography>
          </Box>
        </Box>
      ),
    },
    { id: 'year', label: 'Année', render: (row) => row.year || '—' },
    { id: 'fuelType', label: 'Carburant', render: (row) => row.fuelType || '—' },
    { id: 'currentMileage', label: 'Kilométrage', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.currentMileage) + ' km' },
    {
      id: 'insuranceExpiry', label: 'Assurance',
      render: (row) => {
        if (!row.insuranceExpiry) return '—';
        const isExpired = new Date(row.insuranceExpiry) < new Date();
        return (
          <Chip
            label={new Date(row.insuranceExpiry).toLocaleDateString('fr-FR')}
            size="small"
            color={isExpired ? 'error' : 'success'}
            variant="outlined"
          />
        );
      },
    },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
  ];

  return (
    <Box>
      <PageHeader title="Véhicules" subtitle={`${data.length} véhicule(s)`}
        action={{ label: 'Nouveau véhicule', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['plateNumber', 'brand', 'model']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le véhicule' : 'Nouveau véhicule'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
