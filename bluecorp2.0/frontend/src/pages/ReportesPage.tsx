import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Alert,
  CircularProgress, TextField, Divider, Stack, Chip
} from '@mui/material';
import { Download, TableChart, Receipt, Assessment } from '@mui/icons-material';
import api from '../services/api';

export default function ReportesPage() {
  const [periodoLiq, setPeriodoLiq] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const download = async (fn: () => Promise<Blob>, filename: string) => {
    setLoading(filename);
    setError('');
    setSuccess('');
    try {
      const blob = await fn();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`${filename} descargado correctamente.`);
    } catch {
      setError('Error al generar el reporte');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Reportes</Typography>
        <Typography variant="body2" color="text.secondary">
          Exportación de datos y reportes del sistema previsional
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Afiliados */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TableChart sx={{ color: '#1565c0' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Padrón de Afiliados</Typography>
                  <Chip label="Actualizado" color="success" size="small" />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Listado completo de afiliados con datos personales, tipo de prestación, haber actual y datos bancarios.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Button
                  fullWidth variant="outlined" startIcon={loading === 'afiliados.xlsx' ? <CircularProgress size={16} /> : <Download />}
                  onClick={() => download(() => api.exportarAfiliados('xlsx'), 'afiliados.xlsx')}
                  disabled={loading !== null}
                >
                  Exportar Excel (.xlsx)
                </Button>
                <Button
                  fullWidth variant="outlined" color="secondary" startIcon={loading === 'afiliados.csv' ? <CircularProgress size={16} /> : <Download />}
                  onClick={() => download(() => api.exportarAfiliados('csv'), 'afiliados.csv')}
                  disabled={loading !== null}
                >
                  Exportar CSV
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Liquidaciones */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt sx={{ color: '#6a1b9a' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Liquidaciones por Período</Typography>
                  <Chip label="Histórico" color="info" size="small" />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Reporte de liquidaciones para un período específico con detalle de haberes brutos, descuentos y haberes netos.
              </Typography>
              <TextField
                fullWidth size="small" label="Período (YYYY-MM)"
                value={periodoLiq} onChange={(e) => setPeriodoLiq(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Button
                  fullWidth variant="outlined" color="secondary" startIcon={loading === `liquidaciones_${periodoLiq}.xlsx` ? <CircularProgress size={16} /> : <Download />}
                  onClick={() => download(() => api.exportarLiquidaciones(periodoLiq, 'xlsx'), `liquidaciones_${periodoLiq}.xlsx`)}
                  disabled={loading !== null || !periodoLiq}
                >
                  Exportar Excel (.xlsx)
                </Button>
                <Button
                  fullWidth variant="outlined" startIcon={loading === `liquidaciones_${periodoLiq}.csv` ? <CircularProgress size={16} /> : <Download />}
                  onClick={() => download(() => api.exportarLiquidaciones(periodoLiq, 'csv'), `liquidaciones_${periodoLiq}.csv`)}
                  disabled={loading !== null || !periodoLiq}
                >
                  Exportar CSV
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Guía del sistema */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Assessment sx={{ color: '#2e7d32' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Marco Legal</Typography>
                  <Chip label="Referencia" color="success" size="small" />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Normativa vigente aplicada en los cálculos del sistema SIPA.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                ['Ley 24.241', 'Sistema Integrado Previsional Argentino (SIPA)'],
                ['Art. 19-21', 'Prestación Básica Universal (PBU)'],
                ['Art. 23-25', 'Prestación Compensatoria (PC)'],
                ['Art. 30-31', 'Prestación Adicional Permanencia (PAP)'],
                ['Ley 26.417', 'Movilidad previsional (2008)'],
                ['Ley 27.426', 'Movilidad por IPC (2017)'],
                ['Ley 27.609', 'Movilidad trimestral (2021)'],
                ['DL 274/2024', 'Movilidad por IPC mensual (2024)'],
                ['Ley 19.032', 'PAMI — descuento 3%'],
                ['Ley 23.041', 'SAC proporcional jubilados'],
                ['Art. 120 L.24241', 'Piso 70% haber neto'],
              ].map(([ley, desc]) => (
                <Box key={ley} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Chip label={ley} size="small" variant="outlined" color="primary" sx={{ fontSize: 10, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary">{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
