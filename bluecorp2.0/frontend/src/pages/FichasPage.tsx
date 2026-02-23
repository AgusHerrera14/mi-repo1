import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, MenuItem, Select, FormControl, InputLabel, CircularProgress, Alert
} from '@mui/material';
import { Add, Search, Visibility, Delete, FolderOpen, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { getFichas, createFicha, deleteFicha } from '../services/api';
import { FichaListItem } from '../types';

const TIPO_BENEFICIO_OPTIONS = [
  { value: 'jubilacion_ordinaria', label: 'Jubilación Ordinaria' },
  { value: 'pension_fallecimiento', label: 'Pensión por Fallecimiento' },
  { value: 'retiro_invalidez', label: 'Retiro por Invalidez' },
  { value: 'PUAM', label: 'PUAM' },
];

interface FichaFormData {
  apellido_nombre: string;
  cuil: string;
  dni: string;
  fecha_nacimiento: string;
  sexo: string;
  tipo_beneficio: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  fecha_cese: string;
  observaciones_generales: string;
}

export default function FichasPage() {
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<FichaListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, reset } = useForm<FichaFormData>({
    defaultValues: {
      apellido_nombre: '',
      cuil: '',
      dni: '',
      fecha_nacimiento: '',
      sexo: 'M',
      tipo_beneficio: 'jubilacion_ordinaria',
      localidad: '',
      provincia: '',
      telefono: '',
      email: '',
      fecha_cese: '',
      observaciones_generales: '',
    },
  });

  const loadFichas = async (q?: string) => {
    setLoading(true);
    try {
      const r = await getFichas(q);
      setFichas(r.data);
    } catch {
      setFichas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFichas(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    loadFichas(e.target.value || undefined);
  };

  const onSubmit = async (data: FichaFormData) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...data,
        fecha_cese: data.fecha_cese || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        dni: data.dni || null,
        localidad: data.localidad || null,
        provincia: data.provincia || null,
        telefono: data.telefono || null,
        email: data.email || null,
        observaciones_generales: data.observaciones_generales || null,
      };
      const r = await createFicha(payload);
      setOpenNew(false);
      reset();
      navigate(`/fichas/${r.data.id}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al crear la ficha.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta ficha? Esta acción no se puede deshacer.')) return;
    try {
      await deleteFicha(id);
      loadFichas(search || undefined);
    } catch {
      alert('Error al eliminar la ficha.');
    }
  };

  const beneficioLabel = (b: string) =>
    TIPO_BENEFICIO_OPTIONS.find(o => o.value === b)?.label || b;

  const estadoColor = (e: string): any =>
    ({ calculada: 'success', liquidada: 'primary', borrador: 'default' }[e] ?? 'default');

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Fichas</Typography>
          <Typography color="text.secondary" variant="body2">
            Expedientes de clientes — {fichas.length} ficha{fichas.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { reset(); setError(''); setOpenNew(true); }}
        >
          Nueva Ficha
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TextField
            placeholder="Buscar por nombre, CUIL o número..."
            value={search}
            onChange={handleSearch}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : fichas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <FolderOpen sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
              <Typography color="text.secondary" gutterBottom>
                {search ? 'No se encontraron fichas con ese criterio.' : 'No hay fichas creadas.'}
              </Typography>
              {!search && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{ mt: 2 }}
                  onClick={() => { reset(); setError(''); setOpenNew(true); }}
                >
                  Crear primera ficha
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>N°</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Apellido y Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>CUIL</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tipo de Prestación</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fichas.map(f => (
                    <TableRow
                      key={f.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/fichas/${f.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {f.numero || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {f.apellido_nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {f.cuil}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{beneficioLabel(f.tipo_beneficio)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={f.estado} size="small" color={estadoColor(f.estado)} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {f.fecha_calculo
                            ? new Date(f.fecha_calculo).toLocaleDateString('es-AR')
                            : new Date(f.created_at).toLocaleDateString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <IconButton size="small" onClick={() => navigate(`/fichas/${f.id}`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={e => handleDelete(f.id, e)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nueva Ficha */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Nueva Ficha Previsional</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Controller
                  name="apellido_nombre"
                  control={control}
                  rules={{ required: 'Campo obligatorio' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Apellido y Nombre *"
                      fullWidth
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="cuil"
                  control={control}
                  rules={{ required: 'Campo obligatorio' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="CUIL *"
                      fullWidth
                      size="small"
                      placeholder="20-12345678-9"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="dni"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="DNI" fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="fecha_nacimiento"
                  control={control}
                  rules={{ required: 'Campo obligatorio' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Fecha de Nacimiento *"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Sexo *</InputLabel>
                      <Select {...field} label="Sexo *">
                        <MenuItem value="M">Masculino</MenuItem>
                        <MenuItem value="F">Femenino</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="tipo_beneficio"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de Prestación *</InputLabel>
                      <Select {...field} label="Tipo de Prestación *">
                        {TIPO_BENEFICIO_OPTIONS.map(o => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="fecha_cese"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Fecha de Cese"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="localidad"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Localidad" fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="provincia"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Provincia" fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="telefono"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Teléfono" fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Email" fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="observaciones_generales"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Observaciones"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} /> : 'Crear Ficha'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
