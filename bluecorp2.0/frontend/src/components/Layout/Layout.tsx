import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Menu, MenuItem, Divider, useTheme
} from '@mui/material';
import {
  Folder as FolderIcon,
  Build as BuildIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Logout,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Inicio', path: '/', icon: <DashboardIcon /> },
  { label: 'Mis Fichas', path: '/fichas', icon: <FolderIcon /> },
  { label: 'Herramientas', path: '/herramientas', icon: <BuildIcon /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: -0.5 }}>
          Blue<span style={{ color: '#90caf9' }}>Corp</span>
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
          Cálculo Previsional
        </Typography>
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map(item => {
          const active =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  mx: 1, borderRadius: 2, mb: 0.5,
                  backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiTypography-root': {
                      color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Version */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          Blue Corp v2.0 — SIPA Ley 24.241
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#1565c0' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#1565c0', border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: '#fff', color: 'text.primary', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <IconButton
              onClick={() => navigate('/fichas')}
              sx={{
                mr: 1,
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 36,
                height: 36,
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">{user?.username}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { logout(); setAnchorEl(null); }}>
                <Logout fontSize="small" sx={{ mr: 1 }} /> Cerrar sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
