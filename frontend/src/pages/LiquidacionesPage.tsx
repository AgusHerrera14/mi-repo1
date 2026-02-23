import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  IconButton, Tooltip, Button, TextField, InputAdornment,
  Grid, FormControl, InputLabel, Select, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Search, CheckCircle, Cancel, Visibility, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LiquidacionSummary, Liquidacion } from '../types';
import { useAuth } from '../context/AuthContext';

const ESTADO_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'info' | 'error' }> = {
  borrador: { label: 'Borrador', color: 'default' },
  calculada: { label: 'Calculada', color: 'warning' },
  autorizada: { label: 'Autorizada', color: 'info' },
  pagada: { label: 'Pagada', color: 'success' },
  anulada: { label: 'Anulada', color: 'error' },
};

const formatARS = (v: number) =>
  `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function LiquidacionesPage() {
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [detalle, setDetalle] = useState<Liquidacion | null>(null);
  const { isOperador } = useAuth();
  const navigate = useNavigate();

  const fetchLiquidaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLiquidaciones({
        estado: estadoFiltro || undefined,
        periodo: periodoFiltro || undefined,
        limit: 200,
      });
      setLiquidaciones(data);
    } catch {
      setError('Error al cargar liquidaciones');
    } finally {
      setLoading(false);
    }
  }, [estadoFiltro, periodoFiltro]);

  useEffect(() => {
    fetchLiquidaciones();
  }, [fetchLiquidaciones]);

  const handleAutorizar = async (id: number) => {
    try {
      await api.autorizarLiquidacion(id);
      fetchLiquidaciones();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al autorizar');
    }
  };

  const handleAnular = async (id: number) => {
    try {
      await api.anularLiquidacion(id);
      fetchLiquidaciones();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al anular');
    }
  };

  const handleVerDetalle = async (id: number) => {
    const liq = await api.getLiquidacion(id);
    setDetalle(liq);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Liquidaciones</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de haberes previsionales
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small" placeholder="Período (YYYY-MM)"
              value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} label="Estado">
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <IconButton onClick={fetchLiquidaciones}><Refresh /></IconButton>
          </Grid>
        </Grid>
      </Card>

      {/* Tabla */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>N° Liquidación</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Afiliado ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Haber Neto</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : liquidaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No se encontraron liquidaciones
                  </TableCell>
                </TableRow>
              ) : (
                liquidaciones.map((liq) => {
                  const estado = ESTADO_CONFIG[liq.estado] || { label: liq.estado, color: 'default' as const };
                  return (
                    <TableRow key={liq.id} hover>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace" fontWeight={600} color="primary">
                          {liq.numero_liquidacion || `#${liq.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small" variant="text"
                          onClick={() => navigate(`/afiliados/${liq.afiliado_id}`)}
                        >
                          #{liq.afiliado_id}
                        </Button>
                      </TableCell>
                      <TableCell fontFamily="monospace">{liq.periodo}</TableCell>
                      <TableCell>{liq.tipo}</TableCell>
                      <TableCell>
                        <Chip label={estado.label} color={estado.color} size="small" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color="success.main">{formatARS(liq.haber_neto)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => handleVerDetalle(liq.id)} color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isOperador && liq.estado === 'calculada' && (
                          <Tooltip title="Autorizar">
                            <IconButton size="small" onClick={() => handleAutorizar(liq.id)} color="success">
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isOperador && liq.estado !== 'pagada' && liq.estado !== 'anulada' && (
                          <Tooltip title="Anular">
                            <IconButton size="small" onClick={() => handleAnular(liq.id)} color="error">
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Detalle dialog */}
      {detalle && (
        <Dialog open={true} onClose={() => setDetalle(null)} maxWidth="md" fullWidth>
          <DialogTitle>
            Liquidación {detalle.numero_liquidacion}
            <Chip label={ESTADO_CONFIG[detalle.estado]?.label || detalle.estado} size="small" sx={{ ml: 1 }} />
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>Composición del Haber</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                      <TableCell>Concepto</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right">Base</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell align="right">Importe</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.concepto}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.tipo}
                            color={item.tipo === 'haber' ? 'success' : 'error'}
                            size="small" variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{item.base_calculo ? formatARS(item.base_calculo) : '-'}</TableCell>
                        <TableCell align="right">{item.porcentaje ? `${item.porcentaje.toFixed(2)}%` : '-'}</TableCell>
                        <TableCell align="right">
                          <Typography
                            fontWeight={600}
                            color={item.tipo === 'haber' ? 'success.main' : 'error.main'}
                          >
                            {item.tipo === 'descuento' ? '-' : ''}{formatARS(Math.abs(item.importe))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                      <TableCell colSpan={4}><Typography fontWeight={700}>HABER NETO A COBRAR</Typography></TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" fontWeight={700} color="success.main">{formatARS(detalle.haber_neto)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" display="block">Período</Typography>
                <Typography fontWeight={600}>{detalle.periodo}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" display="block">Coeficiente Movilidad</Typography>
                <Typography fontWeight={600}>{detalle.coeficiente_movilidad.toFixed(4)}x</Typography>
              </Grid>
              {detalle.banco_pago && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">Banco / CBU pago</Typography>
                  <Typography fontWeight={600}>{detalle.banco_pago} · {detalle.cbu_pago}</Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetalle(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
