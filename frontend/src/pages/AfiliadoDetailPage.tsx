import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  Divider, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableHead, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { ArrowBack, Edit, Calculate, Add, Receipt } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Affiliate } from '../types';
import { useAuth } from '../context/AuthContext';

const formatARS = (v: number) =>
  `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const TIPO_LABEL: Record<string, string> = {
  jubilacion_ordinaria: 'Jubilación Ordinaria',
  jubilacion_edad_avanzada: 'Jubilación Edad Avanzada',
  retiro_invalidez: 'Retiro por Invalidez',
  pension_fallecimiento: 'Pensión por Fallecimiento',
  pua: 'PUA',
};

export default function AfiliadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [afiliado, setAfiliado] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openPeriodo, setOpenPeriodo] = useState(false);
  const [openRemuneracion, setOpenRemuneracion] = useState(false);
  const [openLiquidacion, setOpenLiquidacion] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isOperador } = useAuth();
  const navigate = useNavigate();

  const [periodoForm, setPeriodoForm] = useState({
    empleador: '', cuit_empleador: '', fecha_inicio: '',
    fecha_fin: '', categoria: '', tipo_relacion: 'dependencia', aportes_verificados: false
  });

  const [remForm, setRemForm] = useState({
    periodo: '', remuneracion_bruta: 0, remuneracion_imponible: 0, ingresado_anses: false
  });

  const [liqForm, setLiqForm] = useState({
    tipo: 'mensual', periodo: new Date().toISOString().slice(0, 7), fecha_pago: ''
  });

  const loadAfiliado = () => {
    if (!id) return;
    setLoading(true);
    api.getAfiliado(parseInt(id))
      .then(setAfiliado)
      .catch(() => setError('Error al cargar el afiliado'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAfiliado, [id]);

  const handleRecalcular = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.recalcularAfiliado(parseInt(id));
      setAfiliado(updated);
    } catch {
      setError('Error al recalcular');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPeriodo = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.agregarPeriodo(parseInt(id), periodoForm as any);
      setOpenPeriodo(false);
      loadAfiliado();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRemuneracion = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.agregarRemuneracion(parseInt(id), remForm as any);
      setOpenRemuneracion(false);
      loadAfiliado();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleCrearLiquidacion = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.crearLiquidacion({ afiliado_id: parseInt(id), ...liqForm });
      setOpenLiquidacion(false);
      navigate('/liquidaciones');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al crear liquidación');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!afiliado) return <Alert severity="error">Afiliado no encontrado</Alert>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/afiliados')} sx={{ mr: 2 }}>Volver</Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {afiliado.apellido}, {afiliado.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {afiliado.numero_beneficio} · CUIL {afiliado.cuil}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isOperador && (
            <>
              <Button variant="outlined" startIcon={<Calculate />} onClick={handleRecalcular} disabled={saving}>
                Recalcular
              </Button>
              <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/afiliados/${id}/editar`)}>
                Editar
              </Button>
              <Button variant="contained" startIcon={<Receipt />} onClick={() => setOpenLiquidacion(true)}>
                Nueva Liquidación
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Resumen del haber */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'PBU', value: afiliado.pbu_calculada, subtitle: 'Prestación Básica Universal' },
          { label: 'PC', value: afiliado.pc_calculada, subtitle: `${afiliado.anios_aportes_pre_sijp.toFixed(1)} años pre-SIJP` },
          { label: 'PAP', value: afiliado.pap_calculada, subtitle: `${afiliado.anios_aportes_post_sijp.toFixed(1)} años post-SIJP` },
          { label: 'Haber Actual', value: afiliado.haber_actual, subtitle: 'Con movilidad aplicada', highlight: true },
        ].map((item) => (
          <Grid item xs={6} md={3} key={item.label}>
            <Card sx={{
              borderRadius: 3, textAlign: 'center', p: 1,
              bgcolor: item.highlight ? '#1565c0' : 'white',
              color: item.highlight ? 'white' : 'inherit',
              boxShadow: item.highlight ? '0 4px 20px rgba(21,101,192,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="h5" fontWeight={700}>{formatARS(item.value)}</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{item.label}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>{item.subtitle}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Info principal y Tabs */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Datos Personales" />
          <Tab label={`Períodos Laborales (${afiliado.periodos_laborales.length})`} />
          <Tab label={`Remuneraciones (${afiliado.remuneraciones.length})`} />
        </Tabs>

        <CardContent>
          {tabValue === 0 && (
            <Grid container spacing={2}>
              {[
                ['Tipo de Prestación', TIPO_LABEL[afiliado.tipo_prestacion] || afiliado.tipo_prestacion],
                ['Estado', afiliado.estado],
                ['Fecha de Alta', afiliado.fecha_alta || '-'],
                ['Sexo', afiliado.sexo === 'M' ? 'Masculino' : 'Femenino'],
                ['Fecha de Nacimiento', afiliado.fecha_nacimiento],
                ['Nacionalidad', afiliado.nacionalidad || '-'],
                ['Estado Civil', afiliado.estado_civil || '-'],
                ['Teléfono', afiliado.telefono || '-'],
                ['Email', afiliado.email || '-'],
                ['Domicilio', afiliado.domicilio || '-'],
                ['Localidad', afiliado.localidad || '-'],
                ['Provincia', afiliado.provincia || '-'],
                ['Banco', afiliado.banco || '-'],
                ['CBU', afiliado.cbu || '-'],
                ['PBCI (Promedio rem.)', formatARS(afiliado.promedio_remuneraciones)],
                ['Haber Inicial', formatARS(afiliado.haber_inicial)],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} md={4} key={label as string}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value}</Typography>
                </Grid>
              ))}
              {afiliado.observaciones && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body2">{afiliado.observaciones}</Typography>
                </Grid>
              )}
            </Grid>
          )}

          {tabValue === 1 && (
            <Box>
              {isOperador && (
                <Button startIcon={<Add />} variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setOpenPeriodo(true)}>
                  Agregar Período
                </Button>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell fontWeight={700}>Empleador</TableCell>
                    <TableCell>Desde</TableCell>
                    <TableCell>Hasta</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Aportes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {afiliado.periodos_laborales.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin períodos registrados</TableCell></TableRow>
                  ) : afiliado.periodos_laborales.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.empleador}</TableCell>
                      <TableCell>{p.fecha_inicio}</TableCell>
                      <TableCell>{p.fecha_fin || 'Presente'}</TableCell>
                      <TableCell>{p.tipo_relacion}</TableCell>
                      <TableCell>
                        <Chip
                          label={p.aportes_verificados ? 'Verificados' : 'Pendiente'}
                          color={p.aportes_verificados ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              {isOperador && (
                <Button startIcon={<Add />} variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setOpenRemuneracion(true)}>
                  Agregar Remuneración
                </Button>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell>Período</TableCell>
                    <TableCell align="right">Rem. Bruta</TableCell>
                    <TableCell align="right">Rem. Imponible</TableCell>
                    <TableCell align="right">Aporte (11%)</TableCell>
                    <TableCell>ANSES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {afiliado.remuneraciones.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin remuneraciones registradas</TableCell></TableRow>
                  ) : [...afiliado.remuneraciones].sort((a, b) => b.periodo.localeCompare(a.periodo)).map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell fontFamily="monospace">{r.periodo}</TableCell>
                      <TableCell align="right">{formatARS(r.remuneracion_bruta)}</TableCell>
                      <TableCell align="right">{formatARS(r.remuneracion_imponible)}</TableCell>
                      <TableCell align="right">{formatARS(r.aporte_personal || 0)}</TableCell>
                      <TableCell>
                        <Chip label={r.ingresado_anses ? 'Sí' : 'No'} color={r.ingresado_anses ? 'success' : 'default'} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nuevo período */}
      <Dialog open={openPeriodo} onClose={() => setOpenPeriodo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Período Laboral</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Empleador *" value={periodoForm.empleador}
                onChange={(e) => setPeriodoForm({ ...periodoForm, empleador: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="CUIT Empleador" value={periodoForm.cuit_empleador}
                onChange={(e) => setPeriodoForm({ ...periodoForm, cuit_empleador: e.target.value })} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Desde *" type="date" InputLabelProps={{ shrink: true }}
                value={periodoForm.fecha_inicio}
                onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_inicio: e.target.value })} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Hasta" type="date" InputLabelProps={{ shrink: true }}
                value={periodoForm.fecha_fin}
                onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_fin: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Categoría / Cargo" value={periodoForm.categoria}
                onChange={(e) => setPeriodoForm({ ...periodoForm, categoria: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Relación</InputLabel>
                <Select value={periodoForm.tipo_relacion}
                  onChange={(e) => setPeriodoForm({ ...periodoForm, tipo_relacion: e.target.value })}
                  label="Tipo de Relación">
                  <MenuItem value="dependencia">Relación de Dependencia</MenuItem>
                  <MenuItem value="autonomo">Autónomo</MenuItem>
                  <MenuItem value="monotributo">Monotributo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPeriodo(false)}>Cancelar</Button>
          <Button onClick={handleAddPeriodo} variant="contained" disabled={saving || !periodoForm.empleador || !periodoForm.fecha_inicio}>
            {saving ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Nueva remuneración */}
      <Dialog open={openRemuneracion} onClose={() => setOpenRemuneracion(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Remuneración</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Período (YYYY-MM) *" placeholder="2024-01" value={remForm.periodo}
                onChange={(e) => setRemForm({ ...remForm, periodo: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Rem. Bruta *" type="number" value={remForm.remuneracion_bruta}
                onChange={(e) => setRemForm({ ...remForm, remuneracion_bruta: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Rem. Imponible *" type="number" value={remForm.remuneracion_imponible}
                onChange={(e) => setRemForm({ ...remForm, remuneracion_imponible: parseFloat(e.target.value) || 0 })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemuneracion(false)}>Cancelar</Button>
          <Button onClick={handleAddRemuneracion} variant="contained" disabled={saving || !remForm.periodo}>
            {saving ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Nueva liquidación */}
      <Dialog open={openLiquidacion} onClose={() => setOpenLiquidacion(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Liquidación</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={liqForm.tipo} onChange={(e) => setLiqForm({ ...liqForm, tipo: e.target.value })} label="Tipo">
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="retroactivo">Retroactivo</MenuItem>
                  <MenuItem value="aguinaldo">SAC / Aguinaldo</MenuItem>
                  <MenuItem value="inicial">Inicial (alta)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Período (YYYY-MM)" value={liqForm.periodo}
                onChange={(e) => setLiqForm({ ...liqForm, periodo: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Fecha de Pago" type="date" InputLabelProps={{ shrink: true }}
                value={liqForm.fecha_pago}
                onChange={(e) => setLiqForm({ ...liqForm, fecha_pago: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLiquidacion(false)}>Cancelar</Button>
          <Button onClick={handleCrearLiquidacion} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Generar Liquidación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
