import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  EN_ATTENTE: { color: 'default', label: 'En attente' },
  EN_COURS: { color: 'info', label: 'En cours' },
  EN_PAUSE: { color: 'warning', label: 'En pause' },
  TERMINE: { color: 'success', label: 'Terminé' },
  ANNULE: { color: 'error', label: 'Annulé' },
  PRESENT: { color: 'success', label: 'Présent' },
  ABSENT: { color: 'error', label: 'Absent' },
  RETARD: { color: 'warning', label: 'Retard' },
  CONGE: { color: 'info', label: 'Congé' },
  PAYE: { color: 'success', label: 'Payé' },
  PAYEE: { color: 'success', label: 'Payée' },
  PARTIEL: { color: 'warning', label: 'Partiel' },
  PARTIELLEMENT_PAYEE: { color: 'warning', label: 'Partiel' },
  EN_RETARD: { color: 'error', label: 'En retard' },
  BROUILLON: { color: 'default', label: 'Brouillon' },
  EMISE: { color: 'info', label: 'Émise' },
  operational: { color: 'success', label: 'Opérationnel' },
  maintenance: { color: 'warning', label: 'Maintenance' },
  outOfService: { color: 'error', label: 'Hors service' },
  active: { color: 'success', label: 'Actif' },
  inactive: { color: 'default', label: 'Inactif' },
  synced: { color: 'success', label: 'Sync' },
  pending: { color: 'warning', label: 'Non sync' },
  conflict: { color: 'error', label: 'Conflit' },
};

interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  const config = STATUS_CONFIG[status] || { color: 'default', label: status };
  return <Chip label={config.label} color={config.color as any} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />;
}
