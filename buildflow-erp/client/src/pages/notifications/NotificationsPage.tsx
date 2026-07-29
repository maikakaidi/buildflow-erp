import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, Chip, Badge, IconButton, Divider } from '@mui/material';
import {
  Notifications as NotifIcon, Warning, Payment, Schedule, Build, Info,
  CheckCircle, Delete as DeleteIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import api from '../../api/client';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  STOCK_FAIBLE: <Warning color="warning" />,
  ABONNEMENT: <Payment color="error" />,
  MAINTENANCE: <Build color="info" />,
  RETARD: <Schedule color="warning" />,
  PAIEMENT: <Payment color="success" />,
  ECHEANCE: <Schedule color="error" />,
  SYSTEM: <Info color="info" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/modules/notifications', { limit: 100 });
      if (res.success) setNotifications(res.data.items || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <Box>
      <PageHeader title="Notifications" subtitle={`${notifications.filter((n) => !n.isRead).length} non lue(s)`} onRefresh={loadData} />

      {notifications.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NotifIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">Aucune notification</Typography>
        </Box>
      )}

      <List sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {notifications.map((notif, i) => (
          <React.Fragment key={notif.id || i}>
            <ListItem
              sx={{
                bgcolor: notif.isRead ? 'transparent' : 'action.hover',
                borderLeft: notif.isRead ? '3px solid transparent' : '3px solid',
                borderLeftColor: 'primary.main',
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'background.paper', width: 42, height: 42 }}>
                  {TYPE_ICONS[notif.type] || <Info />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={notif.isRead ? 400 : 700}>{notif.title}</Typography>
                    {!notif.isRead && <Chip label="Nouveau" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">{notif.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.createdAt).toLocaleString('fr-FR')}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {i < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}
