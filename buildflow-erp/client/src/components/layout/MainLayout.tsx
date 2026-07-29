import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 280;

export default function MainLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Chargement...</div>
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            mt: '64px',
            p: 3,
            backgroundColor: (theme) => theme.palette.background.default,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
