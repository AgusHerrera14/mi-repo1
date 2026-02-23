import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Alert, Divider, Paper, Tooltip
} from '@mui/material';
import {
  Add, Delete, Calculate, CheckCircle, Cancel, ArrowBack,
  Person, Work, AttachMoney, Gavel, TrendingUp, Info
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Bar } from 'react-chartjs-2';
import {
  getFicha, addServicio, deleteServicio,
  addRemuneracion, deleteRemuneracion,
  calcularDerecho, calcularHaber, calcularReajuste
} from '../services/api';
import { Ficha, ResultadoDerecho, ResultadoHaber, ResultadoReajuste } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, prefix = '$') =>
  n != null
    ? `${prefix}${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

const TIPO_BENEFICIO_LABELS: Record<string, string> = {
  jubilacion_ordinaria: 'Jubilación Ordinaria',
  pension_fallecimiento: 'Pensión por Fallecimiento',
  retiro_invalidez: 'Retiro por Invalidez',
  PUAM: 'PUAM',
};

const estadoColor = (e: string): any =>
  ({ calculada: 'success', liquidada: 'primary', borrador: 'default' }[e] ?? 'default');

// ─── Tab panel ──────────────────────────────────────────────────────────────

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

// ─── Datos personales card ───────────────────────────────────────────────────

function DatosPersonales({ ficha }: { ficha: Ficha }) {
  const rows = [
    { label: 'CUIL', value: ficha.cuil },
    { label: 'DNI', value: ficha.dni || '—' },
    { label: 'Fecha de Nacimiento', value: ficha.fecha_nacimiento ? new Date(ficha.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR') : '—' },
    { label: 'Sexo', value: ficha.sexo === 'M' ? 'Masculino' : 'Femenino' },
    { label: 'Tipo de Prestación', value: TIPO_BENEFICIO_LABELS[ficha.tipo_beneficio] || ficha.tipo_beneficio },
    { label: 'Fecha de Cese', value: ficha.fecha_cese ? new Date(ficha.fecha_cese + 'T00:00:00').toLocaleDateString('es-AR') : '—' },
    { label: 'Localidad', value: [ficha.localidad, ficha.provincia].filter(Boolean).join(', ') || '—' },
    { label: 'Teléfono', value: ficha.telefono || '—' },
    { label: 'Email', value: ficha.email || '—' },
  ];
  return (
    <Grid container spacing={2}>
      {rows.map(r => (
        <Grid item xs={12} sm={6} md={4} key={r.label}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
              {r.label}
            </Typography>
            <Typography variant="body2">{r.value}</Typography>
          </Box>
        </Grid>
      ))}
      {ficha.observaciones_generales && (
        <Grid item xs={12}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
              Observaciones
            </Typography>
            <Typography variant="body2">{ficha.observaciones_generales}</Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );
}

// ─── Servicios tab content ───────────────────────────────────────────────────

interface ServicioFormData {
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  regimen: string;
  empleador: string;
  cuit_empleador: string;
  porcentaje: string;
  nota: string;
}

function ServiciosPanel({ ficha, onReload }: { ficha: Ficha; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { control, handleSubmit, reset } = useForm<ServicioFormData>({
    defaultValues: {
      fecha_inicio: '', fecha_fin: '', tipo: 'dependencia', regimen: 'general',
      empleador: '', cuit_empleador: '', porcentaje: '100', nota: '',
    },
  });

  const onSubmit = async (data: ServicioFormData) => {
    setSaving(true);
    setError('');
    try {
      await addServicio(ficha.id, {
        ...data,
        fecha_fin: data.fecha_fin || null,
        empleador: data.empleador || null,
        cuit_empleador: data.cuit_empleador || null,
        nota: data.nota || null,
        porcentaje: parseFloat(data.porcentaje) || 100,
      });
      setOpen(false);
      reset();
      onReload();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al agregar el período.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este período de servicio?')) return;
    try {
      await deleteServicio(ficha.id, id);
      onReload();
    } catch {
      alert('Error al eliminar el período.');
    }
  };

  // Calcular totales
  const totalAnios = ficha.servicios.reduce((acc, s) => {
    const ini = new Date(s.fecha_inicio);
    const fin = s.fecha_fin ? new Date(s.fecha_fin) : new Date();
    const diffMs = fin.getTime() - ini.getTime();
    return acc + diffMs / (1000 * 60 * 60 * 24 * 365.25) * (s.porcentaje / 100);
  }, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Períodos de Servicio
          <Chip label={`${ficha.servicios.length} períodos`} size="small" sx={{ ml: 1 }} />
          {totalAnios > 0 && (
            <Chip
              label={`≈ ${totalAnios.toFixed(1)} años`}
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        <Button startIcon={<Add />} size="small" variant="outlined" onClick={() => { reset(); setError(''); setOpen(true); }}>
          Agregar Período
        </Button>
      </Box>

      {ficha.servicios.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f5f7fa', borderRadius: 2 }}>
          <Work sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">
            No hay períodos de servicio cargados.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Desde</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hasta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Régimen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Empleador</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">%</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Años</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {ficha.servicios.map(s => {
                const ini = new Date(s.fecha_inicio);
                const fin = s.fecha_fin ? new Date(s.fecha_fin) : new Date();
                const anios = (fin.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24 * 365.25) * (s.porcentaje / 100);
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>{new Date(s.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}</TableCell>
                    <TableCell>
                      {s.fecha_fin
                        ? new Date(s.fecha_fin + 'T00:00:00').toLocaleDateString('es-AR')
                        : <Chip label="En curso" size="small" color="success" />}
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{s.tipo}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{s.regimen}</TableCell>
                    <TableCell>{s.empleador || '—'}</TableCell>
                    <TableCell align="right">{s.porcentaje}%</TableCell>
                    <TableCell align="right">{anios.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog agregar servicio */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Agregar Período de Servicio</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Controller name="fecha_inicio" control={control} rules={{ required: true }}
                  render={({ field }) => (
                    <TextField {...field} label="Fecha Inicio *" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="fecha_fin" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Fecha Fin" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} helperText="Vacío = en curso" />
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="tipo" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo</InputLabel>
                      <Select {...field} label="Tipo">
                        <MenuItem value="dependencia">Relación de Dependencia</MenuItem>
                        <MenuItem value="autonomo">Autónomo</MenuItem>
                        <MenuItem value="monotributo">Monotributo</MenuItem>
                        <MenuItem value="servicio_domestico">Servicio Doméstico</MenuItem>
                        <MenuItem value="regimen_especial">Régimen Especial</MenuItem>
                        <MenuItem value="fuerza_armada">Fuerzas Armadas</MenuItem>
                        <MenuItem value="docente">Docente</MenuItem>
                      </Select>
                    </FormControl>
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="regimen" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Régimen</InputLabel>
                      <Select {...field} label="Régimen">
                        <MenuItem value="general">General (Ley 24.241)</MenuItem>
                        <MenuItem value="pre_sijp">Pre-SIJP (Anterior)</MenuItem>
                        <MenuItem value="reparto">Reparto Público</MenuItem>
                        <MenuItem value="capitalizacion">Capitalización (AFJP)</MenuItem>
                        <MenuItem value="especial">Especial</MenuItem>
                      </Select>
                    </FormControl>
                  )} />
              </Grid>
              <Grid item xs={8}>
                <Controller name="empleador" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Empleador" fullWidth size="small" />
                  )} />
              </Grid>
              <Grid item xs={4}>
                <Controller name="porcentaje" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="% Jornada" fullWidth size="small" type="number" inputProps={{ min: 1, max: 100 }} />
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="cuit_empleador" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="CUIT Empleador" fullWidth size="small" />
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="nota" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Nota" fullWidth size="small" multiline rows={2} />
                  )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : 'Agregar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

// ─── Remuneraciones tab content ──────────────────────────────────────────────

interface RemFormData {
  periodo: string;
  importe_nominal: string;
  tipo: string;
  empleador: string;
  nota: string;
}

function RemuneracionesPanel({ ficha, onReload }: { ficha: Ficha; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { control, handleSubmit, reset } = useForm<RemFormData>({
    defaultValues: { periodo: '', importe_nominal: '', tipo: 'mensual', empleador: '', nota: '' },
  });

  const onSubmit = async (data: RemFormData) => {
    setSaving(true);
    setError('');
    try {
      await addRemuneracion(ficha.id, {
        periodo: data.periodo,
        importe_nominal: parseFloat(data.importe_nominal),
        tipo: data.tipo,
        empleador: data.empleador || null,
        nota: data.nota || null,
      });
      setOpen(false);
      reset();
      onReload();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al agregar la remuneración.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta remuneración?')) return;
    try {
      await deleteRemuneracion(ficha.id, id);
      onReload();
    } catch {
      alert('Error al eliminar.');
    }
  };

  const sorted = [...ficha.remuneraciones].sort((a, b) => a.periodo.localeCompare(b.periodo));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Remuneraciones
          <Chip label={`${ficha.remuneraciones.length} registros`} size="small" sx={{ ml: 1 }} />
        </Typography>
        <Button startIcon={<Add />} size="small" variant="outlined" onClick={() => { reset(); setError(''); setOpen(true); }}>
          Agregar Remuneración
        </Button>
      </Box>

      {sorted.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f5f7fa', borderRadius: 2 }}>
          <AttachMoney sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">
            No hay remuneraciones cargadas.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Empleador</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Importe Nominal</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actualizado</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontFamily: "monospace" }}>{r.periodo}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{r.tipo}</TableCell>
                  <TableCell>{r.empleador || '—'}</TableCell>
                  <TableCell align="right">{fmt(r.importe_nominal)}</TableCell>
                  <TableCell align="right">
                    {r.importe_actualizado != null ? (
                      <Tooltip title={`Factor: ${r.factor_actualizacion?.toFixed(4) || '—'} (${r.indice_actualizacion || '—'})`}>
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          {fmt(r.importe_actualizado)}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Agregar Remuneración</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Controller name="periodo" control={control} rules={{ required: true }}
                  render={({ field }) => (
                    <TextField {...field} label="Período *" fullWidth size="small" placeholder="YYYY-MM" helperText="Ej: 2020-03" />
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="importe_nominal" control={control} rules={{ required: true }}
                  render={({ field }) => (
                    <TextField {...field} label="Importe Nominal *" fullWidth size="small" type="number" inputProps={{ min: 0, step: '0.01' }} />
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="tipo" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo</InputLabel>
                      <Select {...field} label="Tipo">
                        <MenuItem value="mensual">Mensual</MenuItem>
                        <MenuItem value="sac">SAC</MenuItem>
                        <MenuItem value="extraordinario">Extraordinario</MenuItem>
                      </Select>
                    </FormControl>
                  )} />
              </Grid>
              <Grid item xs={6}>
                <Controller name="empleador" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Empleador" fullWidth size="small" />
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="nota" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Nota" fullWidth size="small" />
                  )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : 'Agregar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

// ─── Módulo 1: Derecho ───────────────────────────────────────────────────────

function DerechoPanel({ ficha }: { ficha: Ficha }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDerecho | null>(null);
  const [error, setError] = useState('');
  const [fechaCalculo, setFechaCalculo] = useState('');

  const handleCalcular = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await calcularDerecho(ficha.id, fechaCalculo || undefined);
      setResultado(r.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al calcular el derecho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Módulo 1 — Determinación del Derecho
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Verifica si la persona cumple los requisitos de edad y años de aportes según Ley 24.241.
      </Typography>

      <Card sx={{ mb: 3, mt: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha de cálculo"
                type="date"
                value={fechaCalculo}
                onChange={e => setFechaCalculo(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                helperText="Vacío = fecha actual"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Calculate />}
                onClick={handleCalcular}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Calculando...' : 'Calcular Derecho'}
              </Button>
            </Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {resultado && (
        <Box>
          {/* Diagnóstico principal */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              bgcolor: resultado.tiene_derecho ? '#e8f5e9' : '#ffebee',
              border: `2px solid ${resultado.tiene_derecho ? '#4caf50' : '#f44336'}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {resultado.tiene_derecho
                ? <CheckCircle sx={{ fontSize: 48, color: '#4caf50' }} />
                : <Cancel sx={{ fontSize: 48, color: '#f44336' }} />}
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {resultado.tiene_derecho ? 'TIENE DERECHO' : 'NO TIENE DERECHO'}
                </Typography>
                <Typography variant="body2">{resultado.diagnostico}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Grilla de requisitos */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                label: 'Edad',
                cumple: resultado.cumple_edad,
                actual: `${resultado.edad_actual} años`,
                requerido: `${resultado.edad_requerida} años`,
                faltante: resultado.meses_faltantes_edad > 0 ? `Faltan ${resultado.meses_faltantes_edad} meses` : null,
              },
              {
                label: 'Años de Aportes',
                cumple: resultado.cumple_aportes,
                actual: `${resultado.anios_totales.toFixed(1)} años`,
                requerido: '30 años',
                faltante: resultado.meses_faltantes_aportes > 0 ? `Faltan ${resultado.meses_faltantes_aportes} meses` : null,
              },
              {
                label: 'Regularidad',
                cumple: resultado.cumple_regularidad,
                actual: `${resultado.porcentaje_regularidad.toFixed(1)}%`,
                requerido: '70% mínimo',
                faltante: null,
              },
            ].map(req => (
              <Grid item xs={12} md={4} key={req.label}>
                <Card sx={{ border: `1px solid ${req.cumple ? '#4caf50' : '#f44336'}` }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{req.label}</Typography>
                      {req.cumple
                        ? <CheckCircle sx={{ color: '#4caf50' }} />
                        : <Cancel sx={{ color: '#f44336' }} />}
                    </Box>
                    <Typography variant="h6" fontWeight={700}>{req.actual}</Typography>
                    <Typography variant="caption" color="text.secondary">Requerido: {req.requerido}</Typography>
                    {req.faltante && (
                      <Typography variant="caption" display="block" color="error">
                        {req.faltante}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Detalle de aportes */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Detalle de Aportes
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary" display="block">Pre-SIJP</Typography>
                  <Typography variant="body1" fontWeight={700}>{resultado.anios_pre_sijp.toFixed(1)} años</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary" display="block">Post-SIJP (SIPA)</Typography>
                  <Typography variant="body1" fontWeight={700}>{resultado.anios_post_sijp.toFixed(1)} años</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
                  <Typography variant="body1" fontWeight={700} color="primary">{resultado.anios_totales.toFixed(1)} años</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary" display="block">Regularidad</Typography>
                  <Typography variant="body1" fontWeight={700}>{resultado.porcentaje_regularidad.toFixed(1)}%</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Observaciones */}
          {resultado.observaciones && resultado.observaciones.length > 0 && (
            <Alert severity="info" icon={<Info />}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Observaciones</Typography>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {resultado.observaciones.map((o, i) => (
                  <li key={i}><Typography variant="body2">{o}</Typography></li>
                ))}
              </ul>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Módulo 2: Haber ─────────────────────────────────────────────────────────

function HaberPanel({ ficha }: { ficha: Ficha }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoHaber | null>(null);
  const [error, setError] = useState('');
  const [tipoCalculo, setTipoCalculo] = useState('estimado');
  const [fechaCalculo, setFechaCalculo] = useState('');

  const handleCalcular = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await calcularHaber(ficha.id, tipoCalculo, fechaCalculo || undefined);
      setResultado(r.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al calcular el haber.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = resultado
    ? {
        labels: ['PBU', 'PC', 'PAP', 'PAP Trans.'],
        datasets: [{
          label: 'Componentes del Haber ($)',
          data: [resultado.pbu, resultado.pc, resultado.pap, resultado.pap_transitoria],
          backgroundColor: ['#1565c0', '#2e7d32', '#e65100', '#6a1b9a'],
          borderRadius: 4,
        }],
      }
    : null;

  const chartOptions: any = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            `$${ctx.raw.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v: any) => `$${(v / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Módulo 2 — Cálculo del Haber Inicial
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Calcula PBU + PC + PAP según Ley 24.241 con actualización por RIPTE/Movilidad.
      </Typography>

      <Card sx={{ mb: 3, mt: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Cálculo</InputLabel>
                <Select value={tipoCalculo} onChange={e => setTipoCalculo(e.target.value)} label="Tipo de Cálculo">
                  <MenuItem value="estimado">Estimado</MenuItem>
                  <MenuItem value="exacto">Exacto (con remuneraciones)</MenuItem>
                  <MenuItem value="maximo">Máximo posible</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha de cálculo"
                type="date"
                value={fechaCalculo}
                onChange={e => setFechaCalculo(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                helperText="Vacío = fecha actual"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <TrendingUp />}
                onClick={handleCalcular}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Calculando...' : 'Calcular Haber'}
              </Button>
            </Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {resultado && (
        <Box>
          {/* Haber final destacado */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
              borderRadius: 2,
              color: '#fff',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Haber Inicial Estimado</Typography>
                <Typography variant="h4" fontWeight={800}>
                  {fmt(resultado.haber_final)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Tipo: {resultado.tipo_calculo} — {resultado.anios_totales.toFixed(1)} años de aportes
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Grid container spacing={1}>
                  {[
                    { label: 'Haber Mínimo', value: fmt(resultado.haber_minimo_vigente) },
                    { label: 'Haber Máximo', value: fmt(resultado.haber_maximo_vigente) },
                    { label: 'Complemento', value: fmt(resultado.complemento_minimo) },
                    { label: 'PBCI', value: fmt(resultado.pbci) },
                  ].map(item => (
                    <Grid item xs={6} key={item.label}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 1, p: 1 }}>
                        <Typography variant="caption" sx={{ opacity: 0.75 }}>{item.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            {/* Componentes */}
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Componentes del Haber
                  </Typography>
                  {[
                    { label: 'PBU — Prestación Básica Universal', value: resultado.pbu, color: '#1565c0' },
                    { label: 'PC — Prestación Compensatoria', value: resultado.pc, color: '#2e7d32' },
                    { label: 'PAP — Prestación Adicional por Permanencia', value: resultado.pap, color: '#e65100' },
                    { label: 'PAP Transitoria', value: resultado.pap_transitoria, color: '#6a1b9a' },
                  ].map(c => (
                    <Box key={c.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                        <Typography variant="body2">{c.label}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{fmt(c.value)}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={700}>Haber Bruto</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">{fmt(resultado.haber_bruto)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico */}
            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Distribución
                  </Typography>
                  {chartData && <Bar data={chartData} options={chartOptions} />}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detalle de aportes */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Años de Aportes Considerados
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Pre-SIJP', value: `${resultado.anios_pre_sijp.toFixed(1)} años` },
                  { label: 'Post-SIJP (SIPA)', value: `${resultado.anios_post_sijp.toFixed(1)} años` },
                  { label: 'Total', value: `${resultado.anios_totales.toFixed(1)} años` },
                ].map(d => (
                  <Grid item xs={4} key={d.label}>
                    <Typography variant="caption" color="text.secondary" display="block">{d.label}</Typography>
                    <Typography variant="body1" fontWeight={700}>{d.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {resultado.observaciones && resultado.observaciones.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }} icon={<Info />}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Observaciones</Typography>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {resultado.observaciones.map((o, i) => (
                  <li key={i}><Typography variant="body2">{o}</Typography></li>
                ))}
              </ul>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Módulo 3: Reajuste ──────────────────────────────────────────────────────

interface HaberPercibidoRow {
  periodo: string;
  importe: string;
}

function ReajustePanel({ ficha }: { ficha: Ficha }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoReajuste | null>(null);
  const [error, setError] = useState('');
  const [haberBase, setHaberBase] = useState('');
  const [periodoBase, setPeriodoBase] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFin, setPeriodoFin] = useState('');
  const [metodologia, setMetodologia] = useState('badaro');
  const [rows, setRows] = useState<HaberPercibidoRow[]>([{ periodo: '', importe: '' }]);

  const addRow = () => setRows(r => [...r, { periodo: '', importe: '' }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof HaberPercibidoRow, value: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const handleCalcular = async () => {
    if (!haberBase || !periodoBase || !periodoInicio || !periodoFin) {
      setError('Complete todos los campos obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const haberes_percibidos = rows
        .filter(r => r.periodo && r.importe)
        .map(r => ({ periodo: r.periodo, importe: parseFloat(r.importe) }));

      const r = await calcularReajuste({
        ficha_id: ficha.id,
        haber_base: parseFloat(haberBase),
        periodo_base: periodoBase,
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
        metodologia,
        haberes_percibidos: haberes_percibidos.length > 0 ? haberes_percibidos : undefined,
      });
      setResultado(r.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al calcular el reajuste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Módulo 3 — Reajuste Judicial
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Calcula diferencias mensuales, retroactivo e intereses según movilidad judicial (Res. 589/2019 ANSES / Fallo Badaro).
      </Typography>

      <Card sx={{ mb: 3, mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Parámetros del Reajuste
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Haber Base *"
                value={haberBase}
                onChange={e => setHaberBase(e.target.value)}
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                helperText="Haber otorgado originalmente"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Período Base *"
                value={periodoBase}
                onChange={e => setPeriodoBase(e.target.value)}
                fullWidth
                size="small"
                placeholder="YYYY-MM"
                helperText="Mes del haber base"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Desde *"
                value={periodoInicio}
                onChange={e => setPeriodoInicio(e.target.value)}
                fullWidth
                size="small"
                placeholder="YYYY-MM"
                helperText="Inicio del período a reajustar"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Hasta *"
                value={periodoFin}
                onChange={e => setPeriodoFin(e.target.value)}
                fullWidth
                size="small"
                placeholder="YYYY-MM"
                helperText="Fin del período a reajustar"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Metodología</InputLabel>
                <Select value={metodologia} onChange={e => setMetodologia(e.target.value)} label="Metodología">
                  <MenuItem value="badaro">Badaro / Movilidad Ley</MenuItem>
                  <MenuItem value="ripte">RIPTE</MenuItem>
                  <MenuItem value="ingr">INGR</MenuItem>
                  <MenuItem value="res589">Res. 589/2019 ANSES</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Haberes percibidos */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Haberes Percibidos (opcional)
            </Typography>
            <Button size="small" startIcon={<Add />} onClick={addRow}>
              Agregar fila
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Si no carga haberes percibidos, se asumirá que se percibió sin movilidad.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700, width: 160 }}>Período (YYYY-MM)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Haber Percibido ($)</TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <TextField
                        value={row.periodo}
                        onChange={e => updateRow(i, 'periodo', e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="2020-03"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.importe}
                        onChange={e => updateRow(i, 'importe', e.target.value)}
                        size="small"
                        fullWidth
                        type="number"
                        inputProps={{ min: 0, step: '0.01' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeRow(i)} disabled={rows.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Gavel />}
            onClick={handleCalcular}
            disabled={loading}
          >
            {loading ? 'Calculando...' : 'Calcular Reajuste Judicial'}
          </Button>
        </CardContent>
      </Card>

      {resultado && (
        <Box>
          {/* Resumen total */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, #b71c1c, #c62828)',
              borderRadius: 2,
              color: '#fff',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Retroactivo Bruto</Typography>
                <Typography variant="h6" fontWeight={800}>{fmt(resultado.retroactivo_bruto)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Intereses Punitorios</Typography>
                <Typography variant="h6" fontWeight={800}>{fmt(resultado.intereses_punitorios)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Intereses Resarcitorios</Typography>
                <Typography variant="h6" fontWeight={800}>{fmt(resultado.intereses_resarcitorios)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>TOTAL CRÉDITO</Typography>
                <Typography variant="h5" fontWeight={800}>{fmt(resultado.total_credito)}</Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {resultado.meses_calculados} meses calculados — {resultado.meses_con_diferencia} con diferencia a favor
              </Typography>
            </Box>
          </Paper>

          {/* Tabla diferencias */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Diferencias Mensuales
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Percibido</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Reajustado</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Diferencia</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">% Reajuste</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Coef.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultado.diferencias.map(d => (
                      <TableRow key={d.periodo} hover sx={{ bgcolor: d.diferencia > 0 ? 'rgba(76,175,80,0.05)' : 'inherit' }}>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{d.periodo}</TableCell>
                        <TableCell align="right">{fmt(d.haber_percibido)}</TableCell>
                        <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600 }}>{fmt(d.haber_reajustado)}</TableCell>
                        <TableCell align="right" sx={{ color: d.diferencia > 0 ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
                          {fmt(d.diferencia)}
                        </TableCell>
                        <TableCell align="right">{d.porcentaje_reajuste.toFixed(2)}%</TableCell>
                        <TableCell align="right">{d.coeficiente.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {resultado.observaciones && resultado.observaciones.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }} icon={<Info />}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Observaciones</Typography>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {resultado.observaciones.map((o, i) => (
                  <li key={i}><Typography variant="body2">{o}</Typography></li>
                ))}
              </ul>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function FichaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  const loadFicha = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await getFicha(id);
      setFicha(r.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'No se pudo cargar la ficha.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadFicha(); }, [loadFicha]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ficha) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Ficha no encontrada.'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/fichas')}>
          Volver a Fichas
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/fichas')}
          sx={{ mb: 1.5 }}
          size="small"
        >
          Volver a Fichas
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Person sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>{ficha.apellido_nombre}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                  CUIL: {ficha.cuil}
                </Typography>
                {ficha.numero && (
                  <Typography variant="body2" color="text.secondary">
                    — N° {ficha.numero}
                  </Typography>
                )}
                <Chip
                  label={TIPO_BENEFICIO_LABELS[ficha.tipo_beneficio] || ficha.tipo_beneficio}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip label={ficha.estado} size="small" color={estadoColor(ficha.estado)} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Datos personales */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <DatosPersonales ficha={ficha} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Work fontSize="small" />
                <span>Datos del Expediente</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Calculate fontSize="small" />
                <span>Determinación del Derecho</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp fontSize="small" />
                <span>Cálculo del Haber</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Gavel fontSize="small" />
                <span>Reajuste Judicial</span>
              </Box>
            }
          />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <ServiciosPanel ficha={ficha} onReload={loadFicha} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <RemuneracionesPanel ficha={ficha} onReload={loadFicha} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Card>
          <CardContent>
            <DerechoPanel ficha={ficha} />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Card>
          <CardContent>
            <HaberPanel ficha={ficha} />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Card>
          <CardContent>
            <ReajustePanel ficha={ficha} />
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}
