import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, CircularProgress,
  Alert, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Divider, Stack, IconButton, Tooltip
} from '@mui/material';
import { ArrowBack, Edit, Receipt, Calculate } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Affiliate } from '../types';
import { useAuth } from '../context/AuthContext';

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
const fmt = (v?: string | number | null, suffix = '') =>
  v != null && v !== '' ? `${v}${suffix}` : '-';

export default function AfiliadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOperador } = useAuth();
  const [afiliado, setAfiliado] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.getAfiliado(Number(id))
      .then(setAfiliado)
      .catch(() => setError('Error al cargar afiliado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ textAlign: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!afiliado) return null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/afiliados')}><ArrowBack /></IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {afiliado.apellido}, {afiliado.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              CUIL: {afiliado.cuil} · DNI: {afiliado.dni}
              {afiliado.numero_beneficio && ` · N° Benef: ${afiliado.numero_beneficio}`}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined" startIcon={<Receipt />}
            onClick={() => navigate(`/liquidaciones?afiliado_id=${id}`)}
          >
            Liquidaciones
          </Button>
          {isOperador && (
            <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/afiliados/${id}/editar`)}>
              Editar
            </Button>
          )}
        </Stack>
      </Box>

      {/* Resumen haberes */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Haber Inicial', value: formatARS(afiliado.haber_inicial), color: '#1565c0' },
          { label: 'Haber Actual', value: formatARS(afiliado.haber_actual), color: '#2e7d32' },
          { label: 'PBU', value: formatARS(afiliado.pbu_calculada), color: '#6a1b9a' },
          { label: 'PC', value: formatARS(afiliado.pc_calculada), color: '#bf360c' },
          { label: 'PAP', value: formatARS(afiliado.pap_calculada), color: '#004d40' },
          { label: 'Comp. Zona', value: formatARS(afiliado.complemento_zona), color: '#e65100' },
        ].map((item) => (
          <Grid item xs={6} md={2} key={item.label}>
            <Card sx={{ borderRadius: 3, bgcolor: `${item.color}0e`, border: `1px solid ${item.color}30` }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography fontWeight={700} sx={{ color: item.color, fontSize: 14 }}>{item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
            <Tab label="Datos Personales" />
            <Tab label="Periodos Laborales" />
            <Tab label="Remuneraciones" />
            <Tab label="Descuentos" />
            <Tab label="Datos de Pago" />
          </Tabs>
        </Box>

        {/* Tab 0: Datos personales */}
        {tab === 0 && (
          <CardContent>
            <Grid container spacing={2}>
              {[
                ['Estado', <Chip label={afiliado.estado} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />],
                ['Tipo Prestación', afiliado.tipo_prestacion.replace(/_/g, ' ')],
                ['Fecha Nacimiento', fmt(afiliado.fecha_nacimiento)],
                ['Sexo', afiliado.sexo === 'M' ? 'Masculino' : 'Femenino'],
                ['Estado Civil', fmt(afiliado.estado_civil)],
                ['Nacionalidad', fmt(afiliado.nacionalidad)],
                ['Domicilio', fmt(afiliado.domicilio)],
                ['Localidad', fmt(afiliado.localidad)],
                ['Provincia', fmt(afiliado.provincia)],
                ['Código Postal', fmt(afiliado.codigo_postal)],
                ['Teléfono', fmt(afiliado.telefono)],
                ['Email', fmt(afiliado.email)],
                ['Zona', fmt(afiliado.zona)],
                ['N° Expediente', fmt(afiliado.numero_expediente)],
                ['Fecha Alta', fmt(afiliado.fecha_alta)],
                ['Años Aportes pre-SIJP', fmt(afiliado.anios_aportes_pre_sijp)],
                ['Años Aportes post-SIJP', fmt(afiliado.anios_aportes_post_sijp)],
                ['Promedio Remuneraciones', formatARS(afiliado.promedio_remuneraciones)],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} md={4} key={String(label)}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value as any}</Typography>
                </Grid>
              ))}
              {afiliado.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">Observaciones</Typography>
                  <Typography variant="body2">{afiliado.observaciones}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        )}

        {/* Tab 1: Periodos Laborales */}
        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Empleador', 'CUIT', 'Inicio', 'Fin', 'Tipo Relación', 'Aportes Verif.'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {afiliado.periodos_laborales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin periodos laborales</TableCell>
                  </TableRow>
                ) : afiliado.periodos_laborales.map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell fontWeight={500}>{p.empleador}</TableCell>
                    <TableCell fontFamily="monospace">{p.cuit_empleador || '-'}</TableCell>
                    <TableCell>{p.fecha_inicio}</TableCell>
                    <TableCell>{p.fecha_fin || 'Presente'}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{p.tipo_relacion.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <Chip label={p.aportes_verificados ? 'Sí' : 'No'} color={p.aportes_verificados ? 'success' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 2: Remuneraciones */}
        {tab === 2 && (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Período', 'Rem. Bruta', 'Rem. Imponible', 'Aporte Personal', 'Contrib. Patronal', 'ANSES'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {afiliado.remuneraciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin remuneraciones</TableCell>
                  </TableRow>
                ) : [...afiliado.remuneraciones].reverse().map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell fontFamily="monospace" fontWeight={600}>{r.periodo}</TableCell>
                    <TableCell align="right">{formatARS(r.remuneracion_bruta)}</TableCell>
                    <TableCell align="right">{formatARS(r.remuneracion_imponible)}</TableCell>
                    <TableCell align="right">{r.aporte_personal != null ? formatARS(r.aporte_personal) : '-'}</TableCell>
                    <TableCell align="right">{r.contribucion_patronal != null ? formatARS(r.contribucion_patronal) : '-'}</TableCell>
                    <TableCell>
                      <Chip label={r.ingresado_anses ? 'Sí' : 'No'} color={r.ingresado_anses ? 'success' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 3: Descuentos */}
        {tab === 3 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Tipo', 'Descripción', 'Beneficiario', 'Modalidad', 'Importe Fijo', 'Porcentaje', 'Prioridad', 'Activo'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {afiliado.descuentos_voluntarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin descuentos voluntarios</TableCell>
                  </TableRow>
                ) : afiliado.descuentos_voluntarios.map((d, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{d.tipo}</TableCell>
                    <TableCell>{d.descripcion}</TableCell>
                    <TableCell>{d.beneficiario || '-'}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{d.modalidad}</TableCell>
                    <TableCell align="right">{d.importe_fijo > 0 ? formatARS(d.importe_fijo) : '-'}</TableCell>
                    <TableCell align="right">{d.porcentaje > 0 ? `${d.porcentaje}%` : '-'}</TableCell>
                    <TableCell align="center">{d.prioridad}</TableCell>
                    <TableCell>
                      <Chip label={d.activo ? 'Activo' : 'Inactivo'} color={d.activo ? 'success' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 4: Datos de Pago */}
        {tab === 4 && (
          <CardContent>
            <Grid container spacing={2}>
              {[
                ['Forma de Pago', afiliado.forma_pago],
                ['Banco', afiliado.banco],
                ['Tipo de Cuenta', afiliado.tipo_cuenta],
                ['N° de Cuenta', afiliado.numero_cuenta],
                ['CBU', afiliado.cbu],
                ['Alias CBU', afiliado.alias_cbu],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} md={4} key={String(label)}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={500} fontFamily={label === 'CBU' ? 'monospace' : undefined}>
                    {value || '-'}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}
      </Card>
    </Box>
  );
}
