import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link, Chip, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; icon?: React.ReactNode; onClick: () => void };
  breadcrumbs?: { label: string; path?: string }[];
  syncStatus?: 'synced' | 'pending' | 'offline';
  onRefresh?: () => void;
}

export default function PageHeader({ title, subtitle, action, breadcrumbs, syncStatus, onRefresh }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, i) => (
            crumb.path ? (
              <Link key={i} component="button" variant="body2" onClick={() => navigate(crumb.path!)} sx={{ textDecoration: 'none' }}>
                {crumb.label}
              </Link>
            ) : (
              <Typography key={i} variant="body2" color="text.secondary">{crumb.label}</Typography>
            )
          ))}
        </Breadcrumbs>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" fontWeight={700}>{title}</Typography>
            {syncStatus && (
              <Chip
                size="small"
                label={syncStatus === 'synced' ? 'Sync' : syncStatus === 'pending' ? 'Non sync' : 'Offline'}
                color={syncStatus === 'synced' ? 'success' : syncStatus === 'pending' ? 'warning' : 'error'}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>
          {subtitle && <Typography color="text.secondary" mt={0.5}>{subtitle}</Typography>}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onRefresh && (
            <Tooltip title="Actualiser">
              <IconButton onClick={onRefresh} sx={{ color: 'text.secondary' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          {action && (
            <Button variant="contained" startIcon={action.icon || <AddIcon />} onClick={action.onClick} sx={{ borderRadius: 2 }}>
              {action.label}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
