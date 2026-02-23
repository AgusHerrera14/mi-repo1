import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem,
  Divider, Tooltip, Chip, useTheme, useMediaQuery
} from '@mui/material';
import {
  Dashboard, People, Receipt, BarChart, MenuOpen, Menu as MenuIcon,
  TrendingUp, TableChart, Logout, Person, FolderOpen, NotificationImportant,
  Settings, ChevronLeft
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'Afiliados', icon: <People />, path: '/afiliados' },
  { label: 'Liquidaciones', icon: <Receipt />, path: '/liquidaciones' },
  { label: 'Expedientes', icon: <FolderOpen />, path: '/expedientes' },
  { label: 'Novedades', icon: <NotificationImportant />, path: '/novedades' },
  { label: 'Movilidad', icon: <TrendingUp />, path: '/movilidad' },
  { label: 'RIPTE', icon: <TableChart />, path: '/ripte' },
  { label: 'Reportes', icon: <BarChart />, path: '/reportes' },
];

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' }> = {
  admin: { label: 'Admin', color: 'error' },
  operador: { label: 'Operador', color: 'primary' },
  supervisor: { label: 'Supervisor', color: 'warning' },
  consultor: { label: 'Consultor', color: 'default' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleInfo = user ? (ROLE_LABELS[user.role] || { label: user.role, color: 'default' as const }) : null;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        p: 2, display: 'flex', alignItems: 'center', gap: 1,
        background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
        minHeight: 64,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 14 }}>BC</Typography>
        </Box>
        {open && (
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              Blue Corp
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
              Sistema Previsional
            </Typography>
          </Box>
        )}
      </Box>

      <List sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.filter(item => item.path !== '/reportes' || isAdmin || user?.role === 'supervisor').map((item) => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItemButton
              key={item.path}
              onClick={() => { navigate(item.path); if (isMobile) setOpen(false); }}
              selected={active}
              sx={{
                mx: 1, mb: 0.5, borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'rgba(21,101,192,0.12)',
                  '&:hover': { bgcolor: 'rgba(21,101,192,0.18)' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'primary.main' : 'text.primary',
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {open && user && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {user.full_name[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={600} noWrap display="block">
                {user.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user.username}
              </Typography>
            </Box>
          </Box>
          {roleInfo && (
            <Chip label={roleInfo.label} color={roleInfo.color} size="small" sx={{ fontSize: 10 }} />
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: open ? DRAWER_WIDTH : 64,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : 64,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0} sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton onClick={() => setOpen(!open)} size="small">
              {open ? <ChevronLeft /> : <MenuIcon />}
            </IconButton>

            <Typography variant="h6" fontWeight={600} sx={{ flex: 1, fontSize: 16 }}>
              {NAV_ITEMS.find(n => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path)))?.label || 'Blue Corp'}
            </Typography>

            <Tooltip title={user?.full_name || ''}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
                  {user?.full_name[0] || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>{user?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
