import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Avatar, IconButton, Tooltip } from '@mui/material';
import { Person, PersonOff } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import api from '../../api/client';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Employé' },
  { value: 'VIEWER', label: 'Lecteur' },
];

export default function UsersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

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
    try {
      if (editItem) await api.put(`/company-users/${editItem.id}`, formData);
      else await api.post('/company-users', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
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
      <PageHeader title="Utilisateurs" subtitle={`${data.length} utilisateur(s)`}
        action={{ label: 'Ajouter un utilisateur', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
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
