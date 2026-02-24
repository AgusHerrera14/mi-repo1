import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import {
  Add, PictureAsPdf, CheckCircle, Cancel, Refresh, Calculate,
  Receipt, Visibility
} from '@mui/icons-material';
import api from '../services/api';
import { LiquidacionSummary, Liquidacion } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const ESTADO_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  borrador: 'warning',
  autorizada: 'info',
  pagada: 'success',
  anulada: 'error',
};

export default function LiquidacionesPage() {
  const { isOperador } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const afiliadoIdParam = params.get('afiliado_id');

  const [liquidaciones, setLiquidaciones] = useState<LiquidacionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [periodo, setPeriodo] = useState('');

  // Nueva liquidación
  const [openCalc, setOpenCalc] = useState(false);
  const [calcForm, setCalcForm] = useState({ afiliado_id: afiliadoIdParam || '', periodo: new Date().toISOString().slice(0, 7), tipo: 'mensual' });
  const [calcResult, setCalcResult] = useState<Liquidacion | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ver detalle
  const [viewLiq, setViewLiq] = useState<Liquidacion | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  const fetchLiquidaciones = useCallback(() => {
    setLoading(true);
    api.getLiquidaciones({
      afiliado_id: afiliadoIdParam ? Number(afiliadoIdParam) : undefined,
      estado: estado || undefined,
      tipo: tipo || undefined,
      periodo: periodo || undefined,
      limit: 200,
    })
      .then(setLiquidaciones)
      .catch(() => setError('Error al cargar liquidaciones'))
      .finally(() => setLoading(false));
  }, [estado, tipo, periodo, afiliadoIdParam]);

  useEffect(() => { fetchLiquidaciones(); }, [fetchLiquidaciones]);

  const handleCalcular = async () => {
    setCalculating(true);
    try {
      const res = await api.calcularLiquidacion({
        afiliado_id: Number(calcForm.afiliado_id),
        periodo: calcForm.periodo,
        tipo: calcForm.tipo,
      });
      setCalcResult(res);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al calcular liquidación');
    } finally {
      setCalculating(false);
    }
  };

  const handleGuardar = async () => {
    if (!calcResult) return;
    setSaving(true);
    try {
      await api.guardarLiquidacion(calcResult);
      setOpenCalc(false);
      setCalcResult(null);
      fetchLiquidaciones();
    } catch {
      setError('Error al guardar liquidación');
    } finally {
      setSaving(false);
    }
  };

  const handleAutorizar = async (id: number) => {
    try {
      await api.autorizarLiquidacion(id);
      fetchLiquidaciones();
    } catch {
      setError('Error al autorizar');
    }
  };

  const handleAnular = async (id: number) => {
    if (!window.confirm('¿Anular esta liquidación?')) return;
    try {
      await api.anularLiquidacion(id, 'Anulada por operador');
      fetchLiquidaciones();
    } catch {
      setError('Error al anular');
    }
  };

  const handleVerDetalle = async (id: number) => {
    setLoadingView(true);
    try {
      const liq = await api.getLiquidacion(id);
      setViewLiq(liq);
    } finally {
      setLoadingView(false);
    }
  };

  const handleDescargarPDF = async (id: number) => {
    try {
      const liq = liquidaciones.find(l => l.id === id);
      await api.downloadRecibo(id, `liq_${id}`);
    } catch {
      setError('Error al descargar recibo PDF');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Liquidaciones</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión y cálculo de haberes previsionales
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fetchLiquidaciones}><Refresh /></IconButton>
          {isOperador && (
            <Button variant="contained" startIcon={<Calculate />} onClick={() => setOpenCalc(true)}>
              Nueva Liquidación
            </Button>
          )}
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filtros */}
      <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField size="small" label="Período (YYYY-MM)" value={periodo}
              onChange={(e) => setPeriodo(e.target.value)} placeholder="2024-03" sx={{ width: 180 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={estado} label="Estado" onChange={(e) => setEstado(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="borrador">Borrador</MenuItem>
                <MenuItem value="autorizada">Autorizada</MenuItem>
                <MenuItem value="pagada">Pagada</MenuItem>
                <MenuItem value="anulada">Anulada</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="mensual">Mensual</MenuItem>
                <MenuItem value="sac">SAC</MenuItem>
                <MenuItem value="retroactivo">Retroactivo</MenuItem>
                <MenuItem value="complementaria">Complementaria</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 360px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>N° Liquidación</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Afiliado ID</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="right">Haber Neto</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={36} /></TableCell></TableRow>
              ) : liquidaciones.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No hay liquidaciones</TableCell></TableRow>
              ) : liquidaciones.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.numero_liquidacion || `LIQ-${l.id}`}</TableCell>
                  <TableCell>{l.afiliado_id}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{l.periodo}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{l.tipo}</TableCell>
                  <TableCell>
                    <Chip label={l.estado} color={ESTADO_COLOR[l.estado] || 'default'} size="small" variant="outlined" sx={{ textTransform: 'capitalize', fontSize: 11 }} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatARS(l.haber_neto)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.3} justifyContent="center">
                      <IconButton size="small" onClick={() => handleVerDetalle(l.id)} title="Ver detalle"><Visibility fontSize="small" /></IconButton>
                      {isOperador && l.estado === 'borrador' && (
                        <IconButton size="small" onClick={() => handleAutorizar(l.id)} color="success" title="Autorizar"><CheckCircle fontSize="small" /></IconButton>
                      )}
                      {isOperador && (l.estado === 'borrador' || l.estado === 'autorizada') && (
                        <IconButton size="small" onClick={() => handleAnular(l.id)} color="error" title="Anular"><Cancel fontSize="small" /></IconButton>
                      )}
                      {(l.estado === 'autorizada' || l.estado === 'pagada') && (
                        <IconButton size="small" onClick={() => handleDescargarPDF(l.id)} color="primary" title="Descargar Recibo PDF"><PictureAsPdf fontSize="small" /></IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog: Calcular nueva liquidación */}
      <Dialog open={openCalc} onClose={() => { setOpenCalc(false); setCalcResult(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Liquidación</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="ID Afiliado" type="number"
                value={calcForm.afiliado_id} onChange={(e) => setCalcForm(p => ({ ...p, afiliado_id: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Período (YYYY-MM)"
                value={calcForm.periodo} onChange={(e) => setCalcForm(p => ({ ...p, periodo: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={calcForm.tipo} label="Tipo" onChange={(e) => setCalcForm(p => ({ ...p, tipo: e.target.value }))}>
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="complementaria">Complementaria</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {calcResult && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Resultado del Cálculo</Typography>
              <Grid container spacing={1}>
                {[
                  ['PBU', formatARS(calcResult.pbu)],
                  ['PC', formatARS(calcResult.pc)],
                  ['PAP', formatARS(calcResult.pap)],
                  ['Comp. Zona', formatARS(calcResult.complemento_zona)],
                  ['Haber Bruto', formatARS(calcResult.haber_bruto)],
                  ['Movilidad', `${calcResult.porcentaje_movilidad?.toFixed(2)}%`],
                  ['Haber c/Movilidad', formatARS(calcResult.haber_con_movilidad)],
                  ['Desc. PAMI (3%)', formatARS(calcResult.descuento_pami)],
                  ['Desc. Sindicato', formatARS(calcResult.descuento_sindicato)],
                  ['Desc. Mutual', formatARS(calcResult.descuento_mutual)],
                  ['Total Descuentos', formatARS(calcResult.total_descuentos)],
                ].map(([k, v]) => (
                  <Grid item xs={6} sm={4} key={k}>
                    <Typography variant="caption" color="text.secondary">{k}</Typography>
                    <Typography variant="body2" fontWeight={500}>{v}</Typography>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Box sx={{ bgcolor: '#1565c0', color: 'white', p: 2, borderRadius: 2, textAlign: 'center', mt: 1 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>HABER NETO</Typography>
                    <Typography variant="h4" fontWeight={700}>{formatARS(calcResult.haber_neto)}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenCalc(false); setCalcResult(null); }}>Cancelar</Button>
          <Button variant="outlined" onClick={handleCalcular} disabled={calculating || !calcForm.afiliado_id}>
            {calculating ? <CircularProgress size={20} /> : 'Calcular'}
          </Button>
          {calcResult && (
            <Button variant="contained" onClick={handleGuardar} disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'Guardar Liquidación'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog: Ver detalle */}
      <Dialog open={Boolean(viewLiq)} onClose={() => setViewLiq(null)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle Liquidación {viewLiq?.numero_liquidacion}</DialogTitle>
        <DialogContent>
          {viewLiq && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Concepto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Importe</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewLiq.items.map((item, i) => (
                  <TableRow key={i} sx={{ bgcolor: item.tipo === 'descuento' ? '#fff3f3' : 'transparent' }}>
                    <TableCell>{item.concepto}</TableCell>
                    <TableCell>
                      <Chip label={item.tipo} size="small" color={item.tipo === 'haber' ? 'success' : 'error'} variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ color: item.tipo === 'descuento' ? 'error.main' : 'success.main', fontWeight: 600 }}>
                      {item.tipo === 'descuento' ? '- ' : ''}{formatARS(item.importe)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                  <TableCell sx={{ fontWeight: 700 }} colSpan={2}>HABER NETO</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#1565c0', fontSize: 16 }}>{formatARS(viewLiq.haber_neto)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewLiq(null)}>Cerrar</Button>
          {viewLiq && (viewLiq.estado === 'autorizada' || viewLiq.estado === 'pagada') && (
            <Button variant="contained" startIcon={<PictureAsPdf />} onClick={() => api.downloadRecibo(viewLiq.id, `liq_${viewLiq.id}`)}>
              Descargar Recibo PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
