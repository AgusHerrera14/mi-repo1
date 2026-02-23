import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Switch, FormControlLabel
} from '@mui/material';
import { Add, CheckCircle, Refresh } from '@mui/icons-material';
import api from '../services/api';
import { Novedad } from '../types';
import { useAuth } from '../context/AuthContext';

const ESTADO_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pendiente: 'warning',
  aplicada: 'success',
  rechazada: 'error',
  vencida: 'default',
};

const TIPOS_NOVEDAD = [
  'suspension', 'reincorporacion', 'cambio_banco', 'cambio_domicilio',
  'fallecimiento', 'incapacidad', 'reajuste_judicial', 'bono_extraordinario',
  'descuento_especial', 'retroactivo',
];

export default function NovedadesPage() {
  const { isOperador } = useAuth();
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [tipo, setTipo] = useState('');

  const [openNew, setOpenNew] = useState(false);
  const [newForm, setNewForm] = useState({
    afiliado_id: '', tipo: 'suspension', descripcion: '',
    periodo_desde: '', periodo_hasta: '',
    importe_impacto: '0', impacta_haber: false,
    numero_resolucion: '', observaciones: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchNovedades = useCallback(() => {
    setLoading(true);
    api.getNovedades({ estado: estado || undefined, tipo: tipo || undefined, limit: 200 })
      .then(setNovedades)
      .catch(() => setError('Error al cargar novedades'))
      .finally(() => setLoading(false));
  }, [estado, tipo]);

  useEffect(() => { fetchNovedades(); }, [fetchNovedades]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.createNovedad({
        ...newForm,
        afiliado_id: Number(newForm.afiliado_id),
        importe_impacto: parseFloat(newForm.importe_impacto) || 0,
        estado: 'pendiente',
      } as any);
      setOpenNew(false);
      fetchNovedades();
    } catch {
      setError('Error al crear novedad');
    } finally {
      setSaving(false);
    }
  };

  const handleAplicar = async (id: number) => {
    try {
      await api.aplicarNovedad(id);
      fetchNovedades();
    } catch {
      setError('Error al aplicar novedad');
    }
  };

  const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Novedades</Typography>
          <Typography variant="body2" color="text.secondary">
            Eventos y modificaciones que afectan los haberes previsionales
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fetchNovedades}><Refresh /></IconButton>
          {isOperador && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenNew(true)}>
              Nueva Novedad
            </Button>
          )}
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Box sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={estado} label="Estado" onChange={(e) => setEstado(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="aplicada">Aplicada</MenuItem>
                <MenuItem value="rechazada">Rechazada</MenuItem>
                <MenuItem value="vencida">Vencida</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {TIPOS_NOVEDAD.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {['Afiliado ID', 'Tipo', 'Descripción', 'Período Desde', 'Período Hasta', 'Impacto', 'Afecta Haber', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress size={36} /></TableCell></TableRow>
              ) : novedades.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>No hay novedades</TableCell></TableRow>
              ) : novedades.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>{n.afiliado_id}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{n.tipo.replace(/_/g, ' ')}</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" noWrap title={n.descripcion}>{n.descripcion}</Typography>
                  </TableCell>
                  <TableCell fontFamily="monospace">{n.periodo_desde || '-'}</TableCell>
                  <TableCell fontFamily="monospace">{n.periodo_hasta || '-'}</TableCell>
                  <TableCell align="right" sx={{ color: n.importe_impacto !== 0 ? (n.importe_impacto > 0 ? 'success.main' : 'error.main') : 'text.secondary', fontWeight: 600 }}>
                    {n.importe_impacto !== 0 ? formatARS(n.importe_impacto) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={n.impacta_haber ? 'Sí' : 'No'} color={n.impacta_haber ? 'warning' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={n.estado} color={ESTADO_COLOR[n.estado] || 'default'} size="small" variant="outlined" sx={{ textTransform: 'capitalize', fontSize: 11 }} />
                  </TableCell>
                  <TableCell>
                    {isOperador && n.estado === 'pendiente' && (
                      <IconButton size="small" color="success" onClick={() => handleAplicar(n.id)} title="Aplicar novedad">
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog nueva novedad */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Novedad</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="ID Afiliado" type="number"
                value={newForm.afiliado_id} onChange={(e) => setNewForm(p => ({ ...p, afiliado_id: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={newForm.tipo} label="Tipo" onChange={(e) => setNewForm(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS_NOVEDAD.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Descripción" multiline rows={2}
                value={newForm.descripcion} onChange={(e) => setNewForm(p => ({ ...p, descripcion: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Período Desde (YYYY-MM)"
                value={newForm.periodo_desde} onChange={(e) => setNewForm(p => ({ ...p, periodo_desde: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Período Hasta (YYYY-MM)"
                value={newForm.periodo_hasta} onChange={(e) => setNewForm(p => ({ ...p, periodo_hasta: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Importe Impacto (ARS)" type="number"
                value={newForm.importe_impacto} onChange={(e) => setNewForm(p => ({ ...p, importe_impacto: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={<Switch checked={newForm.impacta_haber} onChange={(e) => setNewForm(p => ({ ...p, impacta_haber: e.target.checked }))} />}
                label="Afecta haber mensual"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="N° Resolución (opcional)"
                value={newForm.numero_resolucion} onChange={(e) => setNewForm(p => ({ ...p, numero_resolucion: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observaciones" multiline rows={2}
                value={newForm.observaciones} onChange={(e) => setNewForm(p => ({ ...p, observaciones: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenNew(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !newForm.afiliado_id || !newForm.descripcion}>
            {saving ? <CircularProgress size={20} /> : 'Crear Novedad'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
