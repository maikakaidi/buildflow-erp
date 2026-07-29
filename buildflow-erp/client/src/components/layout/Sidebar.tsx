import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Collapse, useTheme, alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Construction as ChantierIcon,
  People as EmployeeIcon,
  Engineering as WorkerIcon,
  Inventory as StockIcon,
  ShoppingCart as PurchaseIcon,
  Receipt as ExpenseIcon,
  LocalShipping as VehicleIcon,
  Description as DocumentIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  ExpandLess, ExpandMore,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  AttachMoney as MoneyIcon,
  EventNote as PresenceIcon,
  Work as ContractIcon,
  Warehouse as WarehouseIcon,
  DirectionsBus as TransportIcon,
  Category as CategoryIcon,
  Handshake as SupplierIcon,
  Badge as ClientIcon,
  Map as LocationIcon,
  SwapHoriz as SwapHorizIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 280;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: { label: string; path: string; icon: React.ReactNode }[];
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Chantiers', path: '/chantiers', icon: <ChantierIcon /> },
  {
    label: 'Ressources Humaines', path: '/rh', icon: <EmployeeIcon />,
    children: [
      { label: 'Employés', path: '/employees', icon: <EmployeeIcon /> },
      { label: 'Ouvriers', path: '/workers', icon: <WorkerIcon /> },
      { label: 'Présences', path: '/presences', icon: <PresenceIcon /> },
      { label: 'Salaires', path: '/salaries', icon: <MoneyIcon /> },
      { label: 'Contrats', path: '/contracts', icon: <ContractIcon /> },
    ],
  },
  {
    label: 'Inventaire', path: '/inventory', icon: <StockIcon />,
    children: [
      { label: 'Stock', path: '/stock', icon: <StockIcon /> },
      { label: 'Familles', path: '/stock-families', icon: <CategoryIcon /> },
      { label: 'Mouvements', path: '/stock-movements', icon: <SwapHorizIcon /> },
      { label: 'Matériels', path: '/materials', icon: <WarehouseIcon /> },
    ],
  },
  {
    label: 'Achats & Dépenses', path: '/finance', icon: <PurchaseIcon />,
    children: [
      { label: 'Achats', path: '/purchases', icon: <PurchaseIcon /> },
      { label: 'Dépenses', path: '/expenses', icon: <ExpenseIcon /> },
      { label: 'Factures', path: '/invoices', icon: <DocumentIcon /> },
      { label: 'Paiements', path: '/payments', icon: <MoneyIcon /> },
    ],
  },
  {
    label: 'Partenaires', path: '/partners', icon: <SupplierIcon />,
    children: [
      { label: 'Fournisseurs', path: '/suppliers', icon: <SupplierIcon /> },
      { label: 'Clients', path: '/clients', icon: <ClientIcon /> },
    ],
  },
  {
    label: 'Parc & Équipements', path: '/fleet', icon: <VehicleIcon />,
    children: [
      { label: 'Véhicules', path: '/vehicles', icon: <VehicleIcon /> },
      { label: 'Locations', path: '/locations', icon: <LocationIcon /> },
    ],
  },
  { label: 'Documents', path: '/documents', icon: <DocumentIcon /> },
  { label: 'Rapports', path: '/rapports', icon: <ReportIcon /> },
  { label: 'Utilisateurs', path: '/users', icon: <GroupIcon /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationIcon /> },
  { label: 'Paramètres', path: '/settings', icon: <SettingsIcon /> },
];

export default function Sidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleToggle = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (item: NavItem) => {
    if (item.children) return item.children.some((c) => location.pathname === c.path);
    return location.pathname === item.path;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={company?.logo}
          sx={{
            width: 42, height: 42,
            bgcolor: theme.palette.primary.main,
            fontSize: 18, fontWeight: 700,
          }}
        >
          {company?.name?.charAt(0) || 'BF'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>
            {company?.name || 'BuildFlow ERP'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 1 }} />

      <List sx={{ px: 1, flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => (
          <React.Fragment key={item.path}>
            {item.children ? (
              <>
                <ListItemButton
                  onClick={() => handleToggle(item.path)}
                  sx={{
                    borderRadius: 2, mb: 0.5, mx: 0.5,
                    bgcolor: isSectionActive(item) ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isSectionActive(item) ? theme.palette.primary.main : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSectionActive(item) ? 600 : 400 }} />
                  {openSections[item.path] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={openSections[item.path]} timeout="auto">
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        sx={{
                          borderRadius: 2, mb: 0.5, mx: 0.5, pl: 5,
                          bgcolor: isActive(child.path) ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: isActive(child.path) ? theme.palette.primary.main : 'text.secondary', fontSize: 18 }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: isActive(child.path) ? 600 : 400 }} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2, mb: 0.5, mx: 0.5,
                  bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? theme.palette.primary.main : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive(item.path) ? 600 : 400 }} />
              </ListItemButton>
            )}
          </React.Fragment>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          BuildFlow ERP v1.0
        </Typography>
      </Box>
    </Drawer>
  );
}
