import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Chip, Grid, Button
} from '@mui/material';
import { Refresh, CloudDownload } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import api from '../services/api';
import { RIPTERecord } from '../types';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function RIPTEPage() {
  const [registros, setRegistros] = useState<RIPTERecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const fetchRIPTE = async () => {
    setLoading(true);
    try {
      const data = await api.getRIPTE({ limit: 200 });
      setRegistros(data.sort((a, b) => a.periodo.localeCompare(b.periodo)));
    } catch {
      setError('Error al cargar tabla RIPTE');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRIPTE(); }, []);

  const handleCargarHistorico = async () => {
    setCargando(true);
    try {
      await api.cargarRIPTEHistorico();
      await fetchRIPTE();
    } catch {
      setError('Error al cargar histórico');
    } finally {
      setCargando(false);
    }
  };

  // Últimos 24 meses para el gráfico
  const ultimos = registros.slice(-24);
  const chartData = {
    labels: ultimos.map((r) => r.periodo),
    datasets: [{
      label: 'RIPTE (ARS)',
      data: ultimos.map((r) => r.valor),
      borderColor: '#1565c0',
      backgroundColor: 'rgba(21,101,192,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  };

  const ultimo = registros[registros.length - 1];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Tabla RIPTE</Typography>
          <Typography variant="body2" color="text.secondary">
            Remuneración Imponible Promedio de los Trabajadores Estables · Fuente: MTEySS
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<CloudDownload />} variant="outlined" onClick={handleCargarHistorico} disabled={cargando}>
            Cargar Histórico
          </Button>
          <Button startIcon={<Refresh />} variant="outlined" onClick={fetchRIPTE} disabled={loading}>
            Actualizar
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {ultimo && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, bgcolor: '#1565c0', color: 'white', boxShadow: '0 4px 20px rgba(21,101,192,0.3)' }}>
              <CardContent>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Último RIPTE publicado</Typography>
                <Typography variant="h4" fontWeight={700}>{formatARS(ultimo.valor)}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Período: {ultimo.periodo}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Evolución últimos 24 meses</Typography>
                {ultimos.length > 0 && (
                  <Box sx={{ height: 100 }}>
                    <Line data={chartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { display: false },
                        y: { display: false },
                      },
                    }} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabla */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="right">Valor RIPTE</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="center">Var. Mensual</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Fuente</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : [...registros].reverse().map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.periodo}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatARS(r.valor)}</TableCell>
                  <TableCell align="center">
                    {r.variacion_mensual != null ? (
                      <Chip
                        label={`${r.variacion_mensual >= 0 ? '+' : ''}${r.variacion_mensual.toFixed(2)}%`}
                        color={r.variacion_mensual >= 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : <Typography variant="caption" color="text.secondary">-</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{r.fuente}</Typography>
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
