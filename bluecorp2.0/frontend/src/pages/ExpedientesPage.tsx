import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Alert, Chip, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, List, ListItem,
  ListItemText, Divider, Checkbox, FormControlLabel
} from '@mui/material';
import { Add, Visibility, Refresh, FolderOpen, AddComment } from '@mui/icons-material';
import api from '../services/api';
import { Expediente } from '../types';
import { useAuth } from '../context/AuthContext';

const ESTADO_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  iniciado: 'info',
  en_tramite: 'warning',
  resuelto: 'success',
  rechazado: 'error',
  archivado: 'default',
};

const TIPOS_TRAMITE = [
  'alta_jubilacion', 'alta_pension', 'alta_invalidez', 'cambio_banco',
  'actualizacion_datos', 'solicitud_reajuste', 'recurso_administrativo',
  'baja_voluntaria', 'suspension', 'reincorporacion',
];

export default function ExpedientesPage() {
  const { isOperador } = useAuth();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');

  const [openNew, setOpenNew] = useState(false);
  const [newForm, setNewForm] = useState({
    afiliado_id: '', numero_expediente: '', tipo_tramite: 'alta_jubilacion',
    solicitante_nombre: '', es_apoderado: false,
    doc_dni: false, doc_partida_nacimiento: false, doc_certificados_aportes: false,
    doc_declaracion_jurada: false, doc_certificado_laboral: false,
    doc_partida_matrimonio: false, doc_certificado_medico: false,
    observaciones: '',
  });
  const [saving, setSaving] = useState(false);

  const [viewExp, setViewExp] = useState<Expediente | null>(null);
  const [movForm, setMovForm] = useState({ tipo: 'presentacion', descripcion: '', estado_nuevo: '' });
  const [addingMov, setAddingMov] = useState(false);

  const fetchExpedientes = useCallback(() => {
    setLoading(true);
    api.getExpedientes({ estado: estado || undefined, tipo_tramite: tipo || undefined, limit: 200 })
      .then(setExpedientes)
      .catch(() => setError('Error al cargar expedientes'))
      .finally(() => setLoading(false));
  }, [estado, tipo]);

  useEffect(() => { fetchExpedientes(); }, [fetchExpedientes]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.createExpediente({
        ...newForm,
        afiliado_id: Number(newForm.afiliado_id),
        estado: 'iniciado',
        fecha_inicio: new Date().toISOString().split('T')[0],
      } as any);
      setOpenNew(false);
      fetchExpedientes();
    } catch {
      setError('Error al crear expediente');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMovimiento = async () => {
    if (!viewExp) return;
    setAddingMov(true);
    try {
      const updated = await api.addMovimientoExpediente(viewExp.id, movForm);
      setViewExp(updated);
      setMovForm({ tipo: 'presentacion', descripcion: '', estado_nuevo: '' });
      fetchExpedientes();
    } catch {
      setError('Error al agregar movimiento');
    } finally {
      setAddingMov(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Expedientes</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de trámites administrativos previsionales
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fetchExpedientes}><Refresh /></IconButton>
          {isOperador && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenNew(true)}>
              Nuevo Expediente
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
                <MenuItem value="iniciado">Iniciado</MenuItem>
                <MenuItem value="en_tramite">En trámite</MenuItem>
                <MenuItem value="resuelto">Resuelto</MenuItem>
                <MenuItem value="rechazado">Rechazado</MenuItem>
                <MenuItem value="archivado">Archivado</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Tipo de Trámite</InputLabel>
              <Select value={tipo} label="Tipo de Trámite" onChange={(e) => setTipo(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {TIPOS_TRAMITE.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
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
                {['N° Expediente', 'Afiliado ID', 'Tipo Trámite', 'Solicitante', 'Estado', 'Fecha Inicio', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={36} /></TableCell></TableRow>
              ) : expedientes.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No hay expedientes</TableCell></TableRow>
              ) : expedientes.map((exp) => (
                <TableRow key={exp.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{exp.numero_expediente}</TableCell>
                  <TableCell>{exp.afiliado_id}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{exp.tipo_tramite.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{exp.solicitante_nombre || '-'}</TableCell>
                  <TableCell>
                    <Chip label={exp.estado.replace('_', ' ')} color={ESTADO_COLOR[exp.estado] || 'default'} size="small" variant="outlined" sx={{ textTransform: 'capitalize', fontSize: 11 }} />
                  </TableCell>
                  <TableCell>{exp.fecha_inicio}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => setViewExp(exp)}><Visibility fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog nuevo expediente */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Expediente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="ID Afiliado" type="number"
                value={newForm.afiliado_id} onChange={(e) => setNewForm(p => ({ ...p, afiliado_id: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="N° Expediente"
                value={newForm.numero_expediente} onChange={(e) => setNewForm(p => ({ ...p, numero_expediente: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Trámite</InputLabel>
                <Select value={newForm.tipo_tramite} label="Tipo de Trámite" onChange={(e) => setNewForm(p => ({ ...p, tipo_tramite: e.target.value }))}>
                  {TIPOS_TRAMITE.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Solicitante"
                value={newForm.solicitante_nombre} onChange={(e) => setNewForm(p => ({ ...p, solicitante_nombre: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Documentación presentada:</Typography>
              <Grid container>
                {[
                  ['doc_dni', 'DNI'], ['doc_partida_nacimiento', 'Partida Nacimiento'],
                  ['doc_certificados_aportes', 'Certif. Aportes'], ['doc_declaracion_jurada', 'Declaración Jurada'],
                  ['doc_certificado_laboral', 'Certif. Laboral'], ['doc_partida_matrimonio', 'Partida Matrimonio'],
                  ['doc_certificado_medico', 'Certif. Médico'],
                ].map(([key, label]) => (
                  <Grid item xs={6} sm={4} key={key}>
                    <FormControlLabel
                      control={<Checkbox size="small" checked={(newForm as any)[key]}
                        onChange={(e) => setNewForm(p => ({ ...p, [key]: e.target.checked }))} />}
                      label={<Typography variant="body2">{label}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observaciones" multiline rows={2}
                value={newForm.observaciones} onChange={(e) => setNewForm(p => ({ ...p, observaciones: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenNew(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !newForm.afiliado_id || !newForm.numero_expediente}>
            {saving ? <CircularProgress size={20} /> : 'Crear Expediente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog ver expediente */}
      <Dialog open={Boolean(viewExp)} onClose={() => setViewExp(null)} maxWidth="md" fullWidth>
        <DialogTitle>Expediente {viewExp?.numero_expediente}</DialogTitle>
        <DialogContent>
          {viewExp && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {[
                  ['Tipo Trámite', viewExp.tipo_tramite.replace(/_/g, ' ')],
                  ['Estado', viewExp.estado],
                  ['Fecha Inicio', viewExp.fecha_inicio],
                  ['Resolución', viewExp.numero_resolucion || '-'],
                  ['Solicitante', viewExp.solicitante_nombre || '-'],
                ].map(([k, v]) => (
                  <Grid item xs={6} sm={4} key={k}>
                    <Typography variant="caption" color="text.secondary">{k}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>{v}</Typography>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Historial de Movimientos</Typography>
              <List dense>
                {viewExp.movimientos.map((m) => (
                  <React.Fragment key={m.id}>
                    <ListItem>
                      <ListItemText
                        primary={m.descripcion}
                        secondary={`${m.fecha || ''} · ${m.tipo}${m.estado_nuevo ? ` → ${m.estado_nuevo}` : ''}`}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
                {viewExp.movimientos.length === 0 && (
                  <ListItem><ListItemText secondary="Sin movimientos registrados" /></ListItem>
                )}
              </List>

              {isOperador && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Agregar Movimiento</Typography>
                  <Stack spacing={1.5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Tipo</InputLabel>
                      <Select value={movForm.tipo} label="Tipo" onChange={(e) => setMovForm(p => ({ ...p, tipo: e.target.value }))}>
                        {['presentacion', 'pase', 'resolucion', 'notificacion', 'recurso', 'archivo'].map(t => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField size="small" fullWidth label="Descripción" value={movForm.descripcion}
                      onChange={(e) => setMovForm(p => ({ ...p, descripcion: e.target.value }))} />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Nuevo Estado (opcional)</InputLabel>
                      <Select value={movForm.estado_nuevo} label="Nuevo Estado (opcional)"
                        onChange={(e) => setMovForm(p => ({ ...p, estado_nuevo: e.target.value }))}>
                        <MenuItem value="">Sin cambio</MenuItem>
                        {['en_tramite', 'resuelto', 'rechazado', 'archivado'].map(s => (
                          <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<AddComment />} onClick={handleAddMovimiento}
                      disabled={addingMov || !movForm.descripcion}>
                      {addingMov ? <CircularProgress size={20} /> : 'Agregar'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewExp(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
