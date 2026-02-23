import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, TextField, InputAdornment,
  Chip, IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid, Tooltip,
  Tabs, Tab
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Visibility, PersonAdd,
  Refresh, CheckCircle, HourglassEmpty, Cancel, Calculate
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AffiliateSummary } from '../types';
import { useAuth } from '../context/AuthContext';

const ESTADO_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  activo: { label: 'Activo', color: 'success' },
  solicitante: { label: 'Solicitante', color: 'warning' },
  pasivo: { label: 'Pasivo', color: 'default' },
  suspendido: { label: 'Suspendido', color: 'error' },
  baja: { label: 'Baja', color: 'error' },
};

const TIPO_CONFIG: Record<string, string> = {
  jubilacion_ordinaria: 'Jub. Ordinaria',
  jubilacion_edad_avanzada: 'Edad Avanzada',
  retiro_invalidez: 'Retiro Invalidez',
  pension_fallecimiento: 'Pensión',
  pua: 'PUA',
};

const formatARS = (v: number) =>
  `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AfiliadosPage() {
  const [afiliados, setAfiliados] = useState<AffiliateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { isOperador } = useAuth();
  const navigate = useNavigate();

  const fetchAfiliados = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAfiliados({
        busqueda: busqueda || undefined,
        estado: estadoFiltro || undefined,
        tipo_prestacion: tipoFiltro || undefined,
        limit: 200,
      });
      setAfiliados(data);
    } catch {
      setError('Error al cargar afiliados');
    } finally {
      setLoading(false);
    }
  }, [busqueda, estadoFiltro, tipoFiltro]);

  useEffect(() => {
    const timer = setTimeout(fetchAfiliados, 400);
    return () => clearTimeout(timer);
  }, [fetchAfiliados]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.eliminarAfiliado(deleteId);
      setDeleteId(null);
      fetchAfiliados();
    } catch {
      setError('Error al eliminar afiliado');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Afiliados</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de beneficiarios del sistema previsional
          </Typography>
        </Box>
        {isOperador && (
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => navigate('/afiliados/nuevo')}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Afiliado
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, CUIL, DNI o N° beneficio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>
              }}
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
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo Prestación</InputLabel>
              <Select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} label="Tipo Prestación">
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <IconButton onClick={fetchAfiliados}><Refresh /></IconButton>
          </Grid>
        </Grid>
      </Card>

      {/* Tabla */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>N° Beneficio</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Apellido y Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CUIL</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo Prestación</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Haber Actual</TableCell>
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
              ) : afiliados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No se encontraron afiliados
                  </TableCell>
                </TableRow>
              ) : (
                afiliados.map((af) => {
                  const estado = ESTADO_CONFIG[af.estado] || { label: af.estado, color: 'default' as const };
                  return (
                    <TableRow
                      key={af.id}
                      hover
                      sx={{ '&:hover': { bgcolor: '#f0f7ff' }, cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace" fontWeight={600} color="primary">
                          {af.numero_beneficio || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {af.apellido}, {af.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">{af.cuil}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{TIPO_CONFIG[af.tipo_prestacion] || af.tipo_prestacion}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={estado.label}
                          color={estado.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color={af.haber_actual > 0 ? 'text.primary' : 'text.disabled'}>
                          {af.haber_actual > 0 ? formatARS(af.haber_actual) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => navigate(`/afiliados/${af.id}`)} color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isOperador && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => navigate(`/afiliados/${af.id}/editar`)} color="primary">
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" onClick={() => setDeleteId(af.id)} color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && (
          <Box sx={{ px: 2, py: 1, borderTop: '1px solid #f0f0f0' }}>
            <Typography variant="caption" color="text.secondary">
              {afiliados.length} registros encontrados
            </Typography>
          </Box>
        )}
      </Card>

      {/* Confirm delete */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea eliminar este afiliado? Esta acción no se puede deshacer.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
