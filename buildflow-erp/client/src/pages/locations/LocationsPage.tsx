import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { LocalShipping } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';

export default function LocationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locRes, vehRes] = await Promise.all([
        api.get('/modules/locations', { limit: 200 }),
        api.get('/modules/vehicles', { limit: 500 }),
      ]);
      if (locRes.data.success) setData(locRes.data.data.items);
      if (vehRes.data.success) setVehicles(vehRes.data.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const vehicleOptions = vehicles.map((v: any) => ({
    value: v.id,
    label: `${v.plateNumber} — ${v.brand} ${v.model}`,
  }));

  const formFields: FormField[] = [
    { name: 'vehicleId', label: 'Véhicule', type: 'select', options: vehicleOptions, required: true, gridSize: 12 },
    { name: 'startDate', label: 'Date début', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0], gridSize: 6 },
    { name: 'endDate', label: 'Date fin', type: 'date', gridSize: 6 },
    { name: 'dailyRate', label: 'Tarif journalier (FCFA)', type: 'number', required: true, gridSize: 6 },
    { name: 'totalAmount', label: 'Montant total (FCFA)', type: 'number', gridSize: 6 },
    { name: 'destination', label: 'Destination', gridSize: 6 },
    { name: 'clientName', label: 'Client', gridSize: 6 },
    { name: 'status', label: 'Statut', type: 'select', options: [{ value: 'active', label: 'En cours' }, { value: 'completed', label: 'Terminé' }, { value: 'cancelled', label: 'Annulé' }], defaultValue: 'active', gridSize: 6 },
    { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/locations/${editItem.id}`, formData);
      else await api.post('/modules/locations', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/locations/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const getVehicleLabel = (row: any) => {
    const v = vehicles.find((ve: any) => ve.id === row.vehicleId);
    return v ? `${v.plateNumber} — ${v.brand} ${v.model}` : row.vehicleId;
  };

  const columns: Column<any>[] = [
    { id: 'startDate', label: 'Début', sortable: true, render: (row) => new Date(row.startDate).toLocaleDateString('fr-FR') },
    { id: 'endDate', label: 'Fin', render: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('fr-FR') : '—' },
    { id: 'vehicleId', label: 'Véhicule', render: (row) => getVehicleLabel(row) },
    { id: 'clientName', label: 'Client', render: (row) => row.clientName || '—' },
    { id: 'destination', label: 'Destination', render: (row) => row.destination || '—' },
    { id: 'dailyRate', label: 'Tarif/jour', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.dailyRate) + ' FCFA' },
    { id: 'totalAmount', label: 'Total', align: 'right', render: (row) => <Typography fontWeight={700}>{new Intl.NumberFormat('fr-FR').format(row.totalAmount)} FCFA</Typography> },
    { id: 'status', label: 'Statut', render: (row) => <StatusChip status={row.status} /> },
  ];

  return (
    <Box>
      <PageHeader title="Locations" subtitle={`${data.length} location(s)`}
        action={{ label: 'Nouvelle location', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['clientName', 'destination']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier la location' : 'Nouvelle location'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
