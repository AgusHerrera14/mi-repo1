import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress,
  Alert, LinearProgress, Divider, Chip
} from '@mui/material';
import {
  People, Receipt, TrendingUp, Warning, CheckCircle, AccountBalance
} from '@mui/icons-material';
import api from '../services/api';
import { DashboardStats } from '../types';

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function StatCard({ title, value, sub, icon, color, loading }: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; loading?: boolean;
}) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>{title}</Typography>
            {loading ? <CircularProgress size={24} sx={{ mt: 1 }} /> : (
              <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
            )}
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(() => setError('Error al cargar estadísticas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  const { afiliados, liquidaciones, alertas, distribucion_por_tipo, distribucion_por_provincia } = stats;
  const totalDist = distribucion_por_tipo.reduce((a, d) => a + d.cantidad, 0);
  const totalProv = distribucion_por_provincia.slice(0, 5).reduce((a, d) => a + d.cantidad, 0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Resumen del sistema previsional Blue Corp
        </Typography>
      </Box>

      {/* Alertas */}
      {(alertas.novedades_pendientes > 0 || alertas.expedientes_activos > 0) && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }} icon={<Warning />}>
          {alertas.novedades_pendientes > 0 && `${alertas.novedades_pendientes} novedades pendientes de aplicar. `}
          {alertas.expedientes_activos > 0 && `${alertas.expedientes_activos} expedientes activos en trámite.`}
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Afiliados" value={afiliados.total.toLocaleString()}
            sub={`${afiliados.activos} activos`}
            icon={<People />} color="#1565c0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Haber Promedio" value={formatARS(afiliados.haber_promedio)}
            sub="por afiliado activo"
            icon={<AccountBalance />} color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Masa Mensual" value={formatARS(afiliados.haber_total_mensual)}
            sub="total nómina activa"
            icon={<TrendingUp />} color="#e65100"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Liquidaciones" value={liquidaciones.total.toLocaleString()}
            sub={`${liquidaciones.pagadas} pagadas`}
            icon={<Receipt />} color="#6a1b9a"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Distribución por tipo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Distribución por Tipo de Prestación</Typography>
              <Box sx={{ mt: 2 }}>
                {distribucion_por_tipo.map((d) => (
                  <Box key={d.tipo} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>{d.tipo}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {d.cantidad} ({totalDist > 0 ? ((d.cantidad / totalDist) * 100).toFixed(1) : 0}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={totalDist > 0 ? (d.cantidad / totalDist) * 100 : 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución por provincia */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Top 5 Provincias</Typography>
              <Box sx={{ mt: 2 }}>
                {distribucion_por_provincia.slice(0, 5).map((d) => (
                  <Box key={d.provincia} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>{d.provincia || 'Sin datos'}</Typography>
                      <Typography variant="body2" color="text.secondary">{d.cantidad}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={totalProv > 0 ? (d.cantidad / totalProv) * 100 : 0}
                      color="secondary"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Estado del sistema */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Estado del Sistema</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {[
                  { label: 'Afiliados activos', value: afiliados.activos, color: 'success' as const },
                  { label: 'Afiliados pasivos/baja', value: afiliados.pasivos, color: 'default' as const },
                  { label: 'Solicitantes', value: afiliados.solicitantes, color: 'warning' as const },
                  { label: 'Liq. autorizadas', value: liquidaciones.autorizadas, color: 'primary' as const },
                  { label: 'Liq. pagadas', value: liquidaciones.pagadas, color: 'success' as const },
                  { label: 'Novedades pendientes', value: alertas.novedades_pendientes, color: alertas.novedades_pendientes > 0 ? 'warning' as const : 'default' as const },
                  { label: 'Expedientes activos', value: alertas.expedientes_activos, color: alertas.expedientes_activos > 0 ? 'info' as const : 'default' as const },
                ].map((item) => (
                  <Grid item key={item.label}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip label={item.value} color={item.color} sx={{ mb: 0.5, fontWeight: 700 }} />
                      <Typography variant="caption" display="block" color="text.secondary">{item.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
