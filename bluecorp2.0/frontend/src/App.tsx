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
import FichasPage from './pages/FichasPage';
import FichaDetailPage from './pages/FichaDetailPage';
import HerramientasPage from './pages/HerramientasPage';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0', light: '#1976d2', dark: '#0d47a1' },
    secondary: { main: '#2e7d32' },
    background: { default: '#f0f4f8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid rgba(0,0,0,0.08)' } },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/fichas" element={<ProtectedRoute><Layout><FichasPage /></Layout></ProtectedRoute>} />
      <Route path="/fichas/:id" element={<ProtectedRoute><Layout><FichaDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/herramientas" element={<ProtectedRoute><Layout><HerramientasPage /></Layout></ProtectedRoute>} />
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
