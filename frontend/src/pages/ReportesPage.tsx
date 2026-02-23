import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Alert, Table, TableBody, TableCell, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../services/api';

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

const TIPO_LABEL: Record<string, string> = {
  jubilacion_ordinaria: 'Jub. Ordinaria',
  jubilacion_edad_avanzada: 'Edad Avanzada',
  retiro_invalidez: 'Retiro Invalidez',
  pension_fallecimiento: 'Pensión',
  pua: 'PUA',
};

export default function ReportesPage() {
  const [byTipo, setByTipo] = useState<any[]>([]);
  const [byPeriodo, setByPeriodo] = useState<any[]>([]);
  const [byRango, setByRango] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anio, setAnio] = useState(2025);

  useEffect(() => {
    Promise.all([
      api.getAfiliadosPorTipo(),
      api.getLiquidacionesPorPeriodo(anio),
      api.getHaberesPorRango(),
    ])
      .then(([tipo, periodo, rango]) => {
        setByTipo(tipo);
        setByPeriodo(periodo);
        setByRango(rango);
      })
      .catch(() => setError('Error al cargar reportes'))
      .finally(() => setLoading(false));
  }, [anio]);

  const tipoBarData = {
    labels: byTipo.map((t) => TIPO_LABEL[t.tipo] || t.tipo),
    datasets: [
      {
        label: 'Cantidad',
        data: byTipo.map((t) => t.cantidad),
        backgroundColor: '#1565c0',
        borderRadius: 6,
        yAxisID: 'y',
      },
    ],
  };

  const periodoBarData = {
    labels: byPeriodo.map((p) => p.periodo),
    datasets: [{
      label: 'Masa pagada (ARS)',
      data: byPeriodo.map((p) => p.total_neto),
      backgroundColor: '#2e7d32',
      borderRadius: 6,
    }],
  };

  const rangoColors = ['#1565c0', '#42a5f5', '#26c6da', '#66bb6a'];
  const rangoPieData = byRango ? {
    labels: [
      `Hasta 1x mínimo (≤ ${formatARS(byRango.haber_minimo_referencia)})`,
      '1x a 2x mínimo',
      '2x a 4x mínimo',
      'Más de 4x mínimo',
    ],
    datasets: [{
      data: [
        byRango.rangos.hasta_minimo,
        byRango.rangos['1x_a_2x_minimo'],
        byRango.rangos['2x_a_4x_minimo'],
        byRango.rangos.mas_4x_minimo,
      ],
      backgroundColor: rangoColors,
      borderWidth: 0,
    }],
  } : null;

  if (loading) return (
    <Box display="flex" justifyContent="center" py={8}><CircularProgress size={48} /></Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Reportes y Estadísticas</Typography>
        <Typography variant="body2" color="text.secondary">
          Análisis del padrón de beneficiarios y masa de haberes
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Por tipo de prestación */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Distribución por Tipo de Prestación</Typography>
              {byTipo.length > 0 ? (
                <>
                  <Box sx={{ height: 220 }}>
                    <Bar data={tipoBarData} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
                      },
                    }} />
                  </Box>
                  <Table size="small" sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Cantidad</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Haber Promedio</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Masa Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {byTipo.map((t) => (
                        <TableRow key={t.tipo} hover>
                          <TableCell>{TIPO_LABEL[t.tipo] || t.tipo}</TableCell>
                          <TableCell align="right" fontWeight={600}>{t.cantidad}</TableCell>
                          <TableCell align="right">{formatARS(t.haber_promedio)}</TableCell>
                          <TableCell align="right" fontWeight={600} sx={{ color: 'success.main' }}>
                            {formatARS(t.haber_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  Sin datos de afiliados
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución por rango de haber */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Distribución por Rango de Haber</Typography>
              {byRango && byRango.total_activos > 0 ? (
                <>
                  <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Pie
                      data={rangoPieData!}
                      options={{
                        plugins: {
                          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } }
                        },
                        maintainAspectRatio: false,
                      }}
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total afiliados activos analizados: {byRango.total_activos}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      Haber mínimo de referencia: {formatARS(byRango.haber_minimo_referencia)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  Sin datos de afiliados activos
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Liquidaciones por período */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Liquidaciones por Período</Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Año</InputLabel>
                  <Select value={anio} onChange={(e) => setAnio(Number(e.target.value))} label="Año">
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {byPeriodo.length > 0 ? (
                <>
                  <Box sx={{ height: 200 }}>
                    <Bar data={periodoBarData} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false } },
                        y: {
                          beginAtZero: true, grid: { color: '#f0f0f0' },
                          ticks: { callback: (v) => `$ ${Number(v).toLocaleString('es-AR', { notation: 'compact' })}` }
                        },
                      },
                    }} />
                  </Box>
                  <Table size="small" sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Liquidaciones</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Promedio Neto</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Neto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {byPeriodo.map((p) => (
                        <TableRow key={p.periodo} hover>
                          <TableCell fontFamily="monospace" fontWeight={600}>{p.periodo}</TableCell>
                          <TableCell align="right">{p.cantidad}</TableCell>
                          <TableCell align="right">{formatARS(p.promedio_neto)}</TableCell>
                          <TableCell align="right" fontWeight={700} sx={{ color: 'success.main' }}>
                            {formatARS(p.total_neto)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  Sin liquidaciones para {anio}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
