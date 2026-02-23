import React, { useEffect, useState } from 'react';
import {
  Grid, Typography, Box, Card, CardContent, Chip,
  CircularProgress, Alert, Paper
} from '@mui/material';
import {
  People, Receipt, AccountBalance, TrendingUp,
  CheckCircle, HourglassEmpty, PersonOff
} from '@mui/icons-material';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import api from '../services/api';
import { DashboardStats } from '../types';
import StatCard from '../components/Common/StatCard';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  const tipoLabels = {
    jubilacion_ordinaria: 'Jub. Ordinaria',
    jubilacion_edad_avanzada: 'Edad Avanzada',
    retiro_invalidez: 'Retiro Invalidez',
    pension_fallecimiento: 'Pensión',
    pua: 'PUA',
  } as Record<string, string>;

  const doughnutData = {
    labels: stats.distribucion_por_tipo.map((t) => tipoLabels[t.tipo] || t.tipo),
    datasets: [{
      data: stats.distribucion_por_tipo.map((t) => t.cantidad),
      backgroundColor: ['#1565c0', '#42a5f5', '#26c6da', '#66bb6a', '#ffa726'],
      borderWidth: 0,
    }],
  };

  const provinciaData = {
    labels: stats.distribucion_por_provincia.slice(0, 8).map((p) => p.provincia),
    datasets: [{
      label: 'Afiliados',
      data: stats.distribucion_por_provincia.slice(0, 8).map((p) => p.cantidad),
      backgroundColor: '#1565c0',
      borderRadius: 6,
    }],
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bienvenido, {user?.full_name}. Resumen general del sistema.
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Afiliados"
            value={stats.afiliados.total}
            subtitle={`${stats.afiliados.activos} activos`}
            icon={<People />}
            color="#1565c0"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Haber Promedio"
            value={formatARS(stats.afiliados.haber_promedio)}
            subtitle="Beneficiarios activos"
            icon={<AccountBalance />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Masa Salarial"
            value={formatARS(stats.afiliados.haber_total_mensual)}
            subtitle="Total mensual activos"
            icon={<TrendingUp />}
            color="#e65100"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Liquidaciones"
            value={stats.liquidaciones.total}
            subtitle={`${stats.liquidaciones.pagadas} pagadas`}
            icon={<Receipt />}
            color="#6a1b9a"
          />
        </Grid>
      </Grid>

      {/* Estado de afiliados */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Estado de Afiliados</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Activos', value: stats.afiliados.activos, color: '#2e7d32', icon: <CheckCircle /> },
                  { label: 'Solicitantes', value: stats.afiliados.solicitantes, color: '#e65100', icon: <HourglassEmpty /> },
                  { label: 'Pasivos / Baja', value: stats.afiliados.pasivos, color: '#c62828', icon: <PersonOff /> },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: `${item.color}08`, borderRadius: 2 }}>
                    <Box sx={{ color: item.color, mr: 1.5 }}>{item.icon}</Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h6" fontWeight={700} color={item.color}>{item.value}</Typography>
                    </Box>
                    <Chip
                      label={`${((item.value / stats.afiliados.total) * 100).toFixed(1)}%`}
                      size="small"
                      sx={{ bgcolor: `${item.color}15`, color: item.color, fontWeight: 600 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Por Tipo de Prestación</Typography>
              {stats.distribucion_por_tipo.length > 0 ? (
                <Box sx={{ height: 220, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut
                    data={doughnutData}
                    options={{
                      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <People sx={{ fontSize: 48, opacity: 0.3 }} />
                  <Typography>Sin datos</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Liquidaciones</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Total', value: stats.liquidaciones.total, color: '#1565c0' },
                  { label: 'Autorizadas', value: stats.liquidaciones.autorizadas, color: '#2e7d32' },
                  { label: 'Pagadas', value: stats.liquidaciones.pagadas, color: '#6a1b9a' },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: '#f5f7fa', borderRadius: 2 }}>
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography variant="h6" fontWeight={700} color={item.color}>{item.value}</Typography>
                  </Box>
                ))}
                <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Masa pagada total</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="#2e7d32">
                    {formatARS(stats.liquidaciones.masa_pagada)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico por provincia */}
      {stats.distribucion_por_provincia.length > 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Afiliados por Provincia (Top 8)</Typography>
            <Box sx={{ height: 280 }}>
              <Bar
                data={provinciaData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
