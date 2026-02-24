import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Chip, Grid, TextField, Button, Divider
} from '@mui/material';
import { Calculate } from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';
import { MovilidadRecord } from '../types';

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function MovilidadPage() {
  const [tabla, setTabla] = useState<MovilidadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [haberBase, setHaberBase] = useState(370000);
  const [periodoInicio, setPeriodoInicio] = useState('2021-Q1');
  const [resultadoSim, setResultadoSim] = useState<any>(null);
  const [loadingSim, setLoadingSim] = useState(false);

  useEffect(() => {
    api.getTablaMovilidad()
      .then(setTabla)
      .catch(() => setError('Error al cargar tabla de movilidad'))
      .finally(() => setLoading(false));
  }, []);

  const handleSimular = async () => {
    setLoadingSim(true);
    try {
      const res = await api.simularMovilidad(haberBase, 12, 2.4);
      setResultadoSim(res);
    } catch {
      setError('Error en la simulación');
    } finally {
      setLoadingSim(false);
    }
  };

  const ultimo = tabla[tabla.length - 1];

  // Últimos 12 períodos para gráfico
  const ultimos12 = tabla.slice(-12);
  const barData = {
    labels: ultimos12.map((r) => r.periodo),
    datasets: [{
      label: '% Aumento',
      data: ultimos12.map((r) => r.pct),
      backgroundColor: ultimos12.map((r) =>
        r.pct > 20 ? '#c62828' : r.pct > 10 ? '#e65100' : '#1565c0'
      ),
      borderRadius: 6,
    }],
  };

  const LEY_COLORS: Record<string, string> = {
    'Ley 26.417': 'primary',
    'Ley 27.426': 'secondary',
    'DNU 163/2020': 'warning',
    'Ley 27.609': 'info',
    'DL 274/2024': 'error',
  } as any;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Movilidad Previsional</Typography>
        <Typography variant="body2" color="text.secondary">
          Coeficientes de ajuste histórico (Ley 26.417, 27.426, 27.609, DL 274/2024)
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {ultimo && (
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, bgcolor: '#1565c0', color: 'white', boxShadow: '0 4px 20px rgba(21,101,192,0.3)' }}>
              <CardContent>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Último ajuste aplicado</Typography>
                <Typography variant="h3" fontWeight={700}>+{ultimo.pct.toFixed(2)}%</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Período: {ultimo.periodo}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{ultimo.ley}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Últimos 12 períodos</Typography>
              {loading ? <CircularProgress size={24} /> : (
                <Box sx={{ height: 140 }}>
                  <Bar data={barData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                      y: {
                        beginAtZero: true, grid: { color: '#f0f0f0' },
                        ticks: { callback: (v) => `${v}%` }
                      },
                    },
                  }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Simulador */}
      <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Simulador de Proyección</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Proyecta el haber a 12 meses con una tasa estimada mensual (referencia: último IPC).
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Haber base (ARS)" type="number"
                value={haberBase} onChange={(e) => setHaberBase(parseFloat(e.target.value) || 0)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained" startIcon={<Calculate />}
                onClick={handleSimular} disabled={loadingSim}
                fullWidth
              >
                {loadingSim ? 'Calculando...' : 'Proyectar 12 meses'}
              </Button>
            </Grid>
          </Grid>
          {resultadoSim && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>{resultadoSim.advertencia}</Alert>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell>Mes</TableCell>
                    <TableCell align="right">Haber Proyectado</TableCell>
                    <TableCell align="right">Var. Acumulada</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultadoSim.proyeccion.map((p: any) => (
                    <TableRow key={p.mes}>
                      <TableCell>Mes {p.mes}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatARS(p.haber_proyectado)}</TableCell>
                      <TableCell align="right">
                        <Chip label={`+${p.variacion_acumulada_pct}%`} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabla histórica */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Tabla Histórica de Movilidad
          </Typography>
        </CardContent>
        <TableContainer sx={{ maxHeight: 450 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Vigencia desde</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="right">% Aumento</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="right">Coef. Acum.</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Marco Legal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : [...tabla].reverse().map((r) => (
                <TableRow key={r.periodo} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.periodo}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.desde}</TableCell>
                  <TableCell align="right">
                    <Typography
                      fontWeight={700}
                      color={r.pct > 20 ? 'error.main' : r.pct > 10 ? 'warning.main' : 'primary.main'}
                    >
                      +{r.pct.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontFamily="monospace">{r.coef_acum?.toFixed(4) || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.ley}
                      size="small"
                      variant="outlined"
                      color={LEY_COLORS[r.ley] || 'default'}
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
