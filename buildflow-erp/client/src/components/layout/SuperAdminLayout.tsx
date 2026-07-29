import React from 'react';
import { Box, Typography, IconButton, Tooltip, AppBar, Toolbar } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { Logout } from '@mui/icons-material';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SuperAdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, ml: '280px', bgcolor: 'background.default' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" fontWeight={700} color="text.primary">
                BuildFlow ERP — Plateforme
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Tooltip title="Déconnexion">
                <IconButton color="error" size="small" onClick={handleLogout}>
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
