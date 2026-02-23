import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider
} from '@mui/material';
import { Add, Folder, Calculate, Build, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getFichas, getValoresVigentes } from '../services/api';
import { FichaListItem } from '../types';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fichas, setFichas] = useState<FichaListItem[]>([]);
  const [vigentes, setVigentes] = useState<any>(null);

  useEffect(() => {
    getFichas().then(r => setFichas(r.data.slice(0, 5))).catch(() => {});
    getValoresVigentes().then(r => setVigentes(r.data)).catch(() => {});
  }, []);

  const estadoColor = (e: string): any =>
    ({ calculada: 'success', liquidada: 'primary', borrador: 'default' }[e] ?? 'default');

  const beneficioLabel = (b: string) =>
    ({
      jubilacion_ordinaria: 'Jubilación',
      pension_fallecimiento: 'Pensión',
      retiro_invalidez: 'Invalidez',
      PUAM: 'PUAM',
    }[b] || b);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Bienvenido, {user?.username}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Sistema de Cálculo Previsional — Ley 24.241 SIPA
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/fichas')}>
          Nueva Ficha
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            title: 'Determinación del Derecho',
            desc: 'Verifica si la persona cumple los requisitos de jubilación, pensión o retiro.',
            icon: <Calculate sx={{ fontSize: 32, color: '#1565c0' }} />,
            color: '#e3f2fd',
            path: '/fichas',
          },
          {
            title: 'Cálculo del Haber',
            desc: 'Calcula PBU + PC + PAP con actualización INGR/RIPTE/Movilidad.',
            icon: <TrendingUp sx={{ fontSize: 32, color: '#2e7d32' }} />,
            color: '#e8f5e9',
            path: '/fichas',
          },
          {
            title: 'Reajuste Judicial',
            desc: 'Diferencias mensuales, retroactivos e intereses Res. 589/2019.',
            icon: <Folder sx={{ fontSize: 32, color: '#e65100' }} />,
            color: '#fff3e0',
            path: '/fichas',
          },
          {
            title: 'Herramientas',
            desc: 'Tablas de movilidad, RIPTE, haberes mínimos/máximos históricos.',
            icon: <Build sx={{ fontSize: 32, color: '#6a1b9a' }} />,
            color: '#f3e5f5',
            path: '/herramientas',
          },
        ].map(m => (
          <Grid item xs={12} sm={6} md={3} key={m.title}>
            <Card
              sx={{ cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 3 } }}
              onClick={() => navigate(m.path)}
            >
              <CardContent>
                <Box
                  sx={{
                    bgcolor: m.color,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'inline-flex',
                    mb: 1.5,
                  }}
                >
                  {m.icon}
                </Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {m.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {m.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Valores vigentes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Valores Vigentes
              </Typography>
              {vigentes ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Período</Typography>
                    <Typography variant="body2" fontWeight={600}>{vigentes.periodo}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Haber Mínimo</Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      ${vigentes.haber_minimo?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">RIPTE</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ${vigentes.ripte?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Cargando...</Typography>
              )}
              <Button size="small" sx={{ mt: 2 }} onClick={() => navigate('/herramientas')}>
                Ver todas las tablas →
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Últimas fichas */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Últimas Fichas</Typography>
                <Button size="small" onClick={() => navigate('/fichas')}>Ver todas →</Button>
              </Box>
              {fichas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary" variant="body2">
                    No hay fichas creadas aún.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    startIcon={<Add />}
                    onClick={() => navigate('/fichas')}
                  >
                    Crear primera ficha
                  </Button>
                </Box>
              ) : (
                <List dense disablePadding>
                  {fichas.map((f, i) => (
                    <React.Fragment key={f.id}>
                      {i > 0 && <Divider />}
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                        }}
                        onClick={() => navigate(`/fichas/${f.id}`)}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              {f.apellido_nombre}
                            </Typography>
                          }
                          secondary={`${f.cuil} — ${beneficioLabel(f.tipo_beneficio)}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip label={f.estado} size="small" color={estadoColor(f.estado)} />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
