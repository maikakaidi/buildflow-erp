import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Avatar, IconButton, Tooltip, Card, CardContent, Button, alpha, useTheme } from '@mui/material';
import { Person, PersonOff, WhatsApp, Warning } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Employé' },
  { value: 'VIEWER', label: 'Lecteur' },
];

export default function UsersPage() {
  const theme = useTheme();
  const { company } = useAuth();
  const maxUsers = company?.maxUsers ?? 3;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/company-users');
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    setLimitError(null);
    try {
      if (editItem) {
        await api.put(`/company-users/${editItem.id}`, formData);
      } else {
        await api.post('/company-users', formData);
      }
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || '';
      if (error.response?.status === 403 && error.response?.data?.limitReached) {
        setLimitError(msg || 'Limite atteinte');
      } else {
        console.error(error);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/company-users/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const formFields: FormField[] = [
    { name: 'firstName', label: 'Prénom', required: true, gridSize: 4 },
    { name: 'lastName', label: 'Nom', required: true, gridSize: 4 },
    { name: 'email', label: 'Email', gridSize: 4 },
    { name: 'phone', label: 'Téléphone', required: true, gridSize: 4 },
    { name: 'password', label: editItem ? 'Nouveau mot de passe (laisser vide)' : 'Mot de passe', type: editItem ? 'text' : 'password', required: !editItem, gridSize: 4 },
    { name: 'role', label: 'Rôle', type: 'select', options: ROLE_OPTIONS, defaultValue: 'EMPLOYEE', gridSize: 4 },
  ];

  const columns: Column<any>[] = [
    {
      id: 'name', label: 'Utilisateur', render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={row.avatar} sx={{ width: 36, height: 36, fontSize: 14, bgcolor: 'primary.main' }}>
            {row.firstName?.charAt(0)}{row.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.firstName} {row.lastName}</Typography>
            {row.email && <Typography variant="caption" color="text.secondary">{row.email}</Typography>}
          </Box>
        </Box>
      ),
    },
    { id: 'phone', label: 'Téléphone', render: (row) => `${row.phoneCode || ''} ${row.phone}` },
    {
      id: 'role', label: 'Rôle',
      render: (row) => <Chip label={ROLE_OPTIONS.find((r) => r.value === row.role)?.label || row.role} size="small" variant="outlined" />,
    },
    {
      id: 'isActive', label: 'Actif',
      render: (row) => <Chip label={row.isActive ? 'Actif' : 'Inactif'} size="small" color={row.isActive ? 'success' : 'default'} />,
    },
    { id: 'lastLoginAt', label: 'Dernière connexion', render: (row) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais' },
  ];

  return (
    <Box>
      <PageHeader title="Utilisateurs" subtitle={`${data.length} utilisateur(s) — ${maxUsers} inclus, puis 20 000 FCFA/extra`}
        action={{ label: 'Ajouter un utilisateur', onClick: () => { setEditItem(null); setDialogOpen(true); setLimitError(null); } }}
        onRefresh={loadData}
      />

      {limitError && (
        <Card sx={{ mb: 3, borderColor: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Warning color="warning" />
              <Typography variant="h6" fontWeight={600} color="warning.main">Limite d'utilisateurs atteinte</Typography>
            </Box>
            <Typography variant="body2" paragraph>
              Vous avez atteint la limite de {maxUsers} utilisateurs. Pour ajouter un nouvel utilisateur, payez <strong>20 000 FCFA</strong> sur l'un des numéros WhatsApp ci-dessous :
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" color="primary" startIcon={<WhatsApp />} href="https://wa.me/22799293329" target="_blank">
                Airtel (Nita) 99293329 — 20 000 FCFA
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<WhatsApp />} href="https://wa.me/22792666942" target="_blank">
                Orange (Amana) 92666942 — 20 000 FCFA
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['firstName', 'lastName', 'email', 'phone']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
