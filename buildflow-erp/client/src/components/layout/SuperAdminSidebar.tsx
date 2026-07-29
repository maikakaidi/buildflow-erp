import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, useTheme, alpha,
} from '@mui/material';
import {
  Dashboard, Business, People, AttachMoney, AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 280;

const navItems = [
  { label: 'Tableau de bord', path: '/admin', icon: <Dashboard /> },
  { label: 'Entreprises', path: '/admin/companies', icon: <Business /> },
  { label: 'Utilisateurs', path: '/admin/users', icon: <People /> },
  { label: 'Paramètres paiement', path: '/admin/payments', icon: <AttachMoney /> },
];

export default function SuperAdminSidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH, boxSizing: 'border-box',
          bgcolor: '#0d1117', color: '#e4e6f0',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: '#dc004e', width: 42, height: 42, fontSize: 18, fontWeight: 700 }}>
          <AdminPanelSettings />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            BuildFlow Admin
          </Typography>
          <Typography variant="caption" sx={{ color: '#dc004e' }}>
            Super Admin
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 1, borderColor: '#2a2e3f' }} />

      <List sx={{ px: 1, flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => navigate(item.path)}
            selected={item.path === '/admin' ? location.pathname === '/admin' || location.pathname === '/admin/' : isActive(item.path)}
            sx={{
              borderRadius: 2, mb: 0.5, mx: 0.5,
              color: isActive(item.path) || (item.path === '/admin' && (location.pathname === '/admin' || location.pathname === '/admin/'))
                ? '#fff' : '#8b949e',
              bgcolor: (isActive(item.path) || (item.path === '/admin' && (location.pathname === '/admin' || location.pathname === '/admin/')))
                ? alpha('#dc004e', 0.2) : 'transparent',
              '&:hover': { bgcolor: alpha('#dc004e', 0.1) },
              '&.Mui-selected': { bgcolor: alpha('#dc004e', 0.2) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive(item.path) ? 600 : 400 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ mx: 2, borderColor: '#2a2e3f' }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: '#8b949e' }} textAlign="center" display="block">
          BuildFlow ERP v1.0 — Admin
        </Typography>
      </Box>
    </Drawer>
  );
}
