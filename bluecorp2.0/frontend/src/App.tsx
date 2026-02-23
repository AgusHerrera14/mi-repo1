import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AfiliadosPage from './pages/AfiliadosPage';
import AfiliadoDetailPage from './pages/AfiliadoDetailPage';
import LiquidacionesPage from './pages/LiquidacionesPage';
import ExpedientesPage from './pages/ExpedientesPage';
import NovedadesPage from './pages/NovedadesPage';
import MovilidadPage from './pages/MovilidadPage';
import RIPTEPage from './pages/RIPTEPage';
import ReportesPage from './pages/ReportesPage';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0', light: '#1976d2', dark: '#0d47a1' },
    secondary: { main: '#6a1b9a' },
    background: { default: '#f4f6f8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid rgba(0,0,0,0.06)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(0,0,0,0.06)' },
      },
    },
  },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/afiliados" element={<ProtectedRoute><Layout><AfiliadosPage /></Layout></ProtectedRoute>} />
      <Route path="/afiliados/:id" element={<ProtectedRoute><Layout><AfiliadoDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/liquidaciones" element={<ProtectedRoute><Layout><LiquidacionesPage /></Layout></ProtectedRoute>} />
      <Route path="/expedientes" element={<ProtectedRoute><Layout><ExpedientesPage /></Layout></ProtectedRoute>} />
      <Route path="/novedades" element={<ProtectedRoute><Layout><NovedadesPage /></Layout></ProtectedRoute>} />
      <Route path="/movilidad" element={<ProtectedRoute><Layout><MovilidadPage /></Layout></ProtectedRoute>} />
      <Route path="/ripte" element={<ProtectedRoute><Layout><RIPTEPage /></Layout></ProtectedRoute>} />
      <Route path="/reportes" element={
        <ProtectedRoute roles={['admin', 'supervisor']}>
          <Layout><ReportesPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
