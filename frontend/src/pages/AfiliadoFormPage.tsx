import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Button, FormControl, InputLabel, Select, MenuItem,
  Alert, CircularProgress, Divider, Stepper, Step, StepLabel
} from '@mui/material';
import { ArrowBack, Save, Calculate } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import api from '../services/api';

const TIPOS_PRESTACION = [
  { value: 'jubilacion_ordinaria', label: 'Jubilación Ordinaria (Art. 19, Ley 24.241)' },
  { value: 'jubilacion_edad_avanzada', label: 'Jubilación por Edad Avanzada (Art. 34)' },
  { value: 'retiro_invalidez', label: 'Retiro por Invalidez (Art. 48)' },
  { value: 'pension_fallecimiento', label: 'Pensión por Fallecimiento (Art. 53)' },
  { value: 'pua', label: 'Prestación Universal para Adulto Mayor (Ley 27.705)' },
];

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego',
  'Tucumán'
];

export default function AfiliadoFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      cuil: '', dni: '', apellido: '', nombre: '',
      fecha_nacimiento: '', sexo: 'M', estado_civil: 'soltero',
      nacionalidad: 'Argentina', domicilio: '', localidad: '',
      provincia: '', codigo_postal: '', telefono: '', email: '',
      tipo_prestacion: 'jubilacion_ordinaria', estado: 'solicitante',
      banco: '', tipo_cuenta: '', numero_cuenta: '', cbu: '',
      alias_cbu: '', observaciones: '',
    }
  });

  useEffect(() => {
    if (isEditing) {
      api.getAfiliado(parseInt(id!))
        .then((data) => {
          reset({
            cuil: data.cuil || '',
            dni: data.dni || '',
            apellido: data.apellido || '',
            nombre: data.nombre || '',
            fecha_nacimiento: data.fecha_nacimiento || '',
            sexo: data.sexo || 'M',
            estado_civil: data.estado_civil || 'soltero',
            nacionalidad: data.nacionalidad || 'Argentina',
            domicilio: data.domicilio || '',
            localidad: data.localidad || '',
            provincia: data.provincia || '',
            codigo_postal: data.codigo_postal || '',
            telefono: data.telefono || '',
            email: data.email || '',
            tipo_prestacion: data.tipo_prestacion || 'jubilacion_ordinaria',
            estado: data.estado || 'solicitante',
            banco: data.banco || '',
            tipo_cuenta: data.tipo_cuenta || '',
            numero_cuenta: data.numero_cuenta || '',
            cbu: data.cbu || '',
            alias_cbu: data.alias_cbu || '',
            observaciones: data.observaciones || '',
          });
        })
        .catch(() => setError('Error al cargar el afiliado'))
        .finally(() => setLoadingData(false));
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await api.actualizarAfiliado(parseInt(id!), data);
        setSuccess('Afiliado actualizado correctamente');
      } else {
        const nuevo = await api.crearAfiliado({ ...data, periodos_laborales: [], remuneraciones: [] });
        setSuccess('Afiliado creado correctamente');
        setTimeout(() => navigate(`/afiliados/${nuevo.id}`), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el afiliado');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/afiliados')} sx={{ mr: 2 }}>
          Volver
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {isEditing ? 'Editar Afiliado' : 'Nuevo Afiliado'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing ? 'Modifique los datos del beneficiario' : 'Complete los datos del nuevo beneficiario'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Datos personales */}
        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
              Datos Personales
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="cuil"
                  control={control}
                  rules={{ required: 'El CUIL es requerido', minLength: { value: 11, message: 'CUIL debe tener 11 dígitos' } }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="CUIL *" placeholder="20123456789"
                      error={!!errors.cuil} helperText={errors.cuil?.message} disabled={isEditing} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="dni"
                  control={control}
                  rules={{ required: 'El DNI es requerido' }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="DNI *"
                      error={!!errors.dni} helperText={errors.dni?.message} disabled={isEditing} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="fecha_nacimiento"
                  control={control}
                  rules={{ required: 'La fecha de nacimiento es requerida' }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Fecha de Nacimiento *" type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.fecha_nacimiento} helperText={errors.fecha_nacimiento?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Controller
                  name="apellido"
                  control={control}
                  rules={{ required: 'El apellido es requerido' }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Apellido *"
                      error={!!errors.apellido} helperText={errors.apellido?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Controller
                  name="nombre"
                  control={control}
                  rules={{ required: 'El nombre es requerido' }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Nombre/s *"
                      error={!!errors.nombre} helperText={errors.nombre?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Sexo *</InputLabel>
                      <Select {...field} label="Sexo *">
                        <MenuItem value="M">Masculino</MenuItem>
                        <MenuItem value="F">Femenino</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6} md={4}>
                <Controller
                  name="estado_civil"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Estado Civil</InputLabel>
                      <Select {...field} label="Estado Civil">
                        <MenuItem value="soltero">Soltero/a</MenuItem>
                        <MenuItem value="casado">Casado/a</MenuItem>
                        <MenuItem value="divorciado">Divorciado/a</MenuItem>
                        <MenuItem value="viudo">Viudo/a</MenuItem>
                        <MenuItem value="union_convivencial">Unión Convivencial</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="nacionalidad"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Nacionalidad" />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Domicilio */}
        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
              Domicilio y Contacto
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller name="domicilio" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Domicilio" />} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Controller name="localidad" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Localidad" />} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Controller name="provincia" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Provincia</InputLabel>
                      <Select {...field} label="Provincia">
                        <MenuItem value="">Seleccione</MenuItem>
                        {PROVINCIAS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
              </Grid>
              <Grid item xs={6} md={2}>
                <Controller name="codigo_postal" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="C.P." />} />
              </Grid>
              <Grid item xs={6} md={4}>
                <Controller name="telefono" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Teléfono" />} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="email" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Email" type="email" />} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Datos previsionales */}
        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
              Datos Previsionales
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="tipo_prestacion"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Prestación *</InputLabel>
                      <Select {...field} label="Tipo de Prestación *">
                        {TIPOS_PRESTACION.map((t) => (
                          <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Estado del Expediente</InputLabel>
                      <Select {...field} label="Estado del Expediente">
                        <MenuItem value="solicitante">Solicitante</MenuItem>
                        <MenuItem value="activo">Activo</MenuItem>
                        <MenuItem value="pasivo">Pasivo</MenuItem>
                        <MenuItem value="suspendido">Suspendido</MenuItem>
                        <MenuItem value="baja">Baja</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Datos bancarios */}
        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
              Datos Bancarios
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller name="banco" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Banco" />} />
              </Grid>
              <Grid item xs={6} md={3}>
                <Controller name="tipo_cuenta" control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Cuenta</InputLabel>
                      <Select {...field} label="Tipo de Cuenta">
                        <MenuItem value="">Sin especificar</MenuItem>
                        <MenuItem value="caja_ahorro">Caja de Ahorro</MenuItem>
                        <MenuItem value="cuenta_corriente">Cuenta Corriente</MenuItem>
                        <MenuItem value="cuenta_basica">Cuenta Básica</MenuItem>
                      </Select>
                    </FormControl>
                  )} />
              </Grid>
              <Grid item xs={6} md={5}>
                <Controller name="numero_cuenta" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="N° de Cuenta" />} />
              </Grid>
              <Grid item xs={12} md={7}>
                <Controller name="cbu" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="CBU (22 dígitos)" inputProps={{ maxLength: 22 }} />} />
              </Grid>
              <Grid item xs={12} md={5}>
                <Controller name="alias_cbu" control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Alias CBU" />} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Controller name="observaciones" control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Observaciones" multiline rows={3} />
              )} />
          </CardContent>
        </Card>

        {/* Acciones */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate('/afiliados')} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={loading}
            sx={{ px: 4 }}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Afiliado'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
