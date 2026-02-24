import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, Button, TextField,
  InputAdornment, Select, MenuItem, FormControl, InputLabel, IconButton,
  Tooltip, Stack
} from '@mui/material';
import { Search, Add, Visibility, Edit, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AffiliateSummary } from '../types';
import { useAuth } from '../context/AuthContext';

const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const ESTADO_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  activo: 'success',
  pasivo: 'default',
  baja: 'error',
  suspendido: 'warning',
  solicitante: 'warning',
};

export default function AfiliadosPage() {
  const navigate = useNavigate();
  const { isOperador } = useAuth();
  const [afiliados, setAfiliados] = useState<AffiliateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');

  const fetchAfiliados = useCallback(() => {
    setLoading(true);
    api.getAfiliados({ search: search || undefined, estado: estado || undefined, tipo: tipo || undefined, limit: 200 })
      .then(setAfiliados)
      .catch(() => setError('Error al cargar afiliados'))
      .finally(() => setLoading(false));
  }, [search, estado, tipo]);

  useEffect(() => { fetchAfiliados(); }, [fetchAfiliados]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Afiliados</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión del padrón de beneficiarios del sistema previsional
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fetchAfiliados}><Refresh /></IconButton>
          {isOperador && (
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/afiliados/nuevo')}>
              Nuevo Afiliado
            </Button>
          )}
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros */}
      <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small" placeholder="Buscar por nombre, CUIL, DNI..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={estado} label="Estado" onChange={(e) => setEstado(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="pasivo">Pasivo</MenuItem>
                <MenuItem value="baja">Baja</MenuItem>
                <MenuItem value="suspendido">Suspendido</MenuItem>
                <MenuItem value="solicitante">Solicitante</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Tipo Prestación</InputLabel>
              <Select value={tipo} label="Tipo Prestación" onChange={(e) => setTipo(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="jubilacion_ordinaria">Jubilación Ordinaria</MenuItem>
                <MenuItem value="retiro_invalidez">Retiro por Invalidez</MenuItem>
                <MenuItem value="pension_fallecimiento">Pensión por Fallecimiento</MenuItem>
                <MenuItem value="jubilacion_anticipada">Jubilación Anticipada</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>CUIL</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Apellido y Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Tipo Prestación</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="right">Haber Actual</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>N° Beneficio</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>Provincia</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} />
                  </TableCell>
                </TableRow>
              ) : afiliados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No se encontraron afiliados
                  </TableCell>
                </TableRow>
              ) : afiliados.map((a) => (
                <TableRow key={a.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/afiliados/${a.id}`)}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.cuil}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{a.apellido}, {a.nombre}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {a.tipo_prestacion.replace(/_/g, ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.estado}
                      color={ESTADO_COLORS[a.estado] || 'default'}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize', fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatARS(a.haber_actual)}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{a.numero_beneficio || '-'}</TableCell>
                  <TableCell>{a.provincia || '-'}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => navigate(`/afiliados/${a.id}`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isOperador && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => navigate(`/afiliados/${a.id}/editar`)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            {afiliados.length} afiliado{afiliados.length !== 1 ? 's' : ''} encontrado{afiliados.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
