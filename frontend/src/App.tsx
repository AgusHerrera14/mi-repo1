import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AfiliadosPage from './pages/AfiliadosPage';
import AfiliadoFormPage from './pages/AfiliadoFormPage';
import AfiliadoDetailPage from './pages/AfiliadoDetailPage';
import LiquidacionesPage from './pages/LiquidacionesPage';
import RIPTEPage from './pages/RIPTEPage';
import MovilidadPage from './pages/MovilidadPage';
import ReportesPage from './pages/ReportesPage';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#6a1b9a' },
    background: { default: '#f5f7fa' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/afiliados" element={<ProtectedRoute><AfiliadosPage /></ProtectedRoute>} />
      <Route path="/afiliados/nuevo" element={<ProtectedRoute><AfiliadoFormPage /></ProtectedRoute>} />
      <Route path="/afiliados/:id" element={<ProtectedRoute><AfiliadoDetailPage /></ProtectedRoute>} />
      <Route path="/afiliados/:id/editar" element={<ProtectedRoute><AfiliadoFormPage /></ProtectedRoute>} />
      <Route path="/liquidaciones" element={<ProtectedRoute><LiquidacionesPage /></ProtectedRoute>} />
      <Route path="/ripte" element={<ProtectedRoute><RIPTEPage /></ProtectedRoute>} />
      <Route path="/movilidad" element={<ProtectedRoute><MovilidadPage /></ProtectedRoute>} />
      <Route path="/reportes" element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
