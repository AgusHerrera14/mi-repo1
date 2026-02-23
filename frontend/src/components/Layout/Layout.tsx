import React, { useState } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Menu, MenuItem, Divider, Chip, useTheme, Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, Receipt, BarChart,
  TableChart, TrendingUp, AccountCircle, Logout, Settings,
  Business, ChevronLeft
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 260;

const menuItems = [
  { path: '/', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/afiliados', label: 'Afiliados', icon: <People /> },
  { path: '/liquidaciones', label: 'Liquidaciones', icon: <Receipt /> },
  { path: '/ripte', label: 'Tabla RIPTE', icon: <TableChart /> },
  { path: '/movilidad', label: 'Movilidad', icon: <TrendingUp /> },
  { path: '/reportes', label: 'Reportes', icon: <BarChart /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          boxShadow: '0 2px 12px rgba(21,101,192,0.3)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setDrawerOpen(!drawerOpen)}
            edge="start"
            sx={{ mr: 2 }}
          >
            {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>

          <Business sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, letterSpacing: 0.5 }}>
            Blue Corp
            <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
              Sistema Previsional
            </Typography>
          </Typography>

          <Chip
            label={user?.role?.toUpperCase()}
            size="small"
            sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }}
          />

          <Tooltip title={user?.full_name || ''}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography fontWeight={600}>{user?.full_name}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        {isAdmin && (
          <MenuItem onClick={() => { navigate('/usuarios'); setAnchorEl(null); }}>
            <Settings fontSize="small" sx={{ mr: 1 }} /> Administración
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} /> Cerrar sesión
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 'none',
            background: '#fff',
            boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5, px: 1 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: '#e3f2fd',
                        color: '#1565c0',
                        '& .MuiListItemIcon-root': { color: '#1565c0' },
                        '&:hover': { bgcolor: '#bbdefb' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontWeight: isActive ? 600 : 400, fontSize: 14 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          transition: 'margin 0.2s',
          ml: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
