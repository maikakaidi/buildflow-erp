import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Box, Badge, ListItemIcon, Divider, useTheme, alpha, InputBase,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NetworkIndicator from '../common/NetworkIndicator';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, company, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backdropFilter: 'blur(10px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <IconButton onClick={onToggleSidebar} sx={{ color: 'text.secondary' }}>
          <MenuIcon />
        </IconButton>

        <Box
          sx={{
            display: 'flex', alignItems: 'center',
            bgcolor: alpha(theme.palette.common.white, 0.05),
            borderRadius: 2, px: 2, py: 0.5, flex: 1, maxWidth: 400,
            border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase placeholder="Rechercher..." sx={{ flex: 1, color: 'text.primary', fontSize: '0.875rem' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NetworkIndicator />

          <IconButton sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenu} sx={{ ml: 1 }}>
            <Avatar
              src={user?.avatar}
              sx={{
                width: 36, height: 36,
                bgcolor: theme.palette.primary.main,
                fontSize: 14, fontWeight: 700,
              }}
            >
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1, minWidth: 200, borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email || user?.phone}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Paramètres
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
