import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Description, GetApp as DownloadIcon, InsertDriveFile } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormDialog, { FormField } from '../../components/common/FormDialog';
import api from '../../api/client';

const TYPE_OPTIONS = [
  { value: 'FACTURE', label: 'Facture' },
  { value: 'DEVIS', label: 'Devis' },
  { value: 'BON_COMMANDE', label: 'Bon de commande' },
  { value: 'BON_LIVRAISON', label: 'Bon de livraison' },
  { value: 'RAPPORT', label: 'Rapport' },
  { value: 'CONTRAT', label: 'Contrat' },
  { value: 'AUTRE', label: 'Autre' },
];

const formFields: FormField[] = [
  { name: 'type', label: 'Type', type: 'select', options: TYPE_OPTIONS, required: true, defaultValue: 'AUTRE', gridSize: 6 },
  { name: 'title', label: 'Titre', required: true, gridSize: 6 },
  { name: 'reference', label: 'Référence', gridSize: 12 },
  { name: 'notes', label: 'Notes', type: 'textarea', gridSize: 12 },
];

export default function DocumentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/documents', { limit: 200 });
      if (res.success) setData(res.data.items);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (formData: Record<string, any>) => {
    setSaving(true);
    try {
      if (editItem) await api.put(`/modules/documents/${editItem.id}`, formData);
      else await api.post('/modules/documents', formData);
      setDialogOpen(false); setEditItem(null); loadData();
    } catch (error) { console.error(error); } finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    try { await api.delete(`/modules/documents/${row.id}`); loadData(); } catch (error) { console.error(error); }
  };

  const columns: Column<any>[] = [
    {
      id: 'title', label: 'Document', sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InsertDriveFile color="primary" />
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
            {row.reference && <Typography variant="caption" color="text.secondary">{row.reference}</Typography>}
          </Box>
        </Box>
      ),
    },
    {
      id: 'type', label: 'Type',
      render: (row) => <Chip label={TYPE_OPTIONS.find((t) => t.value === row.type)?.label || row.type} size="small" variant="outlined" />,
    },
    { id: 'createdAt', label: 'Créé le', render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
    {
      id: 'filePath', label: 'Fichier',
      render: (row) => row.filePath ? (
        <Tooltip title="Télécharger">
          <IconButton size="small" href={row.filePath} target="_blank" download>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Typography variant="caption" color="text.secondary">Aucun fichier</Typography>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Documents" subtitle={`${data.length} document(s)`}
        action={{ label: 'Nouveau document', onClick: () => { setEditItem(null); setDialogOpen(true); } }}
        onRefresh={loadData}
      />
      <DataTable columns={columns} data={data} loading={loading}
        searchFields={['title', 'reference', 'type']}
        onEdit={(row) => { setEditItem(row); setDialogOpen(true); }} onDelete={handleDelete}
      />
      <FormDialog open={dialogOpen} title={editItem ? 'Modifier le document' : 'Nouveau document'}
        fields={formFields} values={editItem} loading={saving}
        onClose={() => { setDialogOpen(false); setEditItem(null); }} onSubmit={handleSubmit}
      />
    </Box>
  );
}
