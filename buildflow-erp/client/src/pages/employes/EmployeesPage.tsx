import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { People } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import StatusChip from '../../components/common/StatusChip';
import api from '../../api/client';
import { useNetwork } from '../../hooks/useNetwork';
import { useOfflineData } from '../../hooks/useOfflineData';

const CONTRACT_OPTIONS = [
  { value: 'CDD', label: 'CDD' },
  { value: 'CDI', label: 'CDI' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'CONSULTANT', label: 'Consultant' },
];

const formFields: FormField[] = [
  { name: 'firstName', label: 'Prénom', required: true, gridSize: 6 },
  { name: 'lastName', label: 'Nom', required: true, gridSize: 6 },
  { name: 'phoneCode', label: 'Indicatif', defaultValue: '+227', gridSize: 3 },
  { name: 'phone', label: 'Téléphone', required: true, gridSize: 9 },
  { name: 'email', label: 'Email', type: 'email', gridSize: 6 },
  { name: 'matricule', label: 'Matricule', gridSize: 6 },
  { name: 'position', label: 'Poste', gridSize: 6 },
  { name: 'department', label: 'Département', gridSize: 6 },
  { name: 'contractType', label: 'Type contrat', type: 'select', options: CONTRACT_OPTIONS, defaultValue: 'CDI', gridSize: 4 },
  { name: 'salary', label: 'Salaire (FCFA)', type: 'number', gridSize: 4 },
  { name: 'hireDate', label: 'Date embauche', type: 'date', gridSize: 4 },
  { name: 'address', label: 'Adresse', gridSize: 12 },
];

export default function EmployeesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { isOnline } = useNetwork();
  const offlineData = useOfflineData('employees');

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/employees', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch {
      await offlineData.refresh();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) {
        if (isOnline) await api.put(`/modules/employees/${editItem.id}`, formData);
        else await offlineData.update(editItem.id, formData);
      } else {
        if (isOnline) await api.post('/modules/employees', formData);
        else await offlineData.add(formData);
      }
      setDialogOpen(false);
      setEditItem(null);
      loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try {
      if (isOnline) await api.delete(`/modules/employees/${row.id}`);
      else await offlineData.remove(row.id);
      loadData();
    } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    {
      id: 'name', label: 'Nom', sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: 'primary.dark' }}>
            {row.firstName?.charAt(0)}{row.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.firstName} {row.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{row.matricule || row.phone}</Typography>
          </Box>
        </Box>
      ),
    },
    { id: 'position', label: 'Poste', render: (row) => row.position || '—' },
    { id: 'department', label: 'Département', render: (row) => row.department || '—' },
    { id: 'contractType', label: 'Contrat', render: (row) => <Chip label={row.contractType} size="small" variant="outlined" /> },
    { id: 'salary', label: 'Salaire', align: 'right', render: (row) => new Intl.NumberFormat('fr-FR').format(row.salary) + ' FCFA' },
    { id: 'isActive', label: 'Statut', render: (row) => <StatusChip status={row.isActive ? 'active' : 'inactive'} /> },
  ];

  const displayData = isOnline ? data : (offlineData.data.length > 0 ? offlineData.data : data);

  return (
    <Box>
      <PageHeader
        title="Employés"
        subtitle={`${displayData.length} employé(s)`}
        action={{ label: 'Nouvel employé', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={displayData} loading={loading}
        searchFields={['firstName', 'lastName', 'matricule', 'position', 'phone']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier l\'employé' : 'Nouvel employé'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
