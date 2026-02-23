import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Tab, Tabs, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, TextField, InputAdornment, Grid
} from '@mui/material';
import { Search, TrendingUp, TableChart, MonetizationOn, Percent } from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
import { getTopes, getRipteHistorico, getMovilidadHistorica, getTasasInteres } from '../services/api';
import { TopeHistorico, MovilidadItem } from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, prefix = '$') =>
  `${prefix}${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

// ─── Topes panel ─────────────────────────────────────────────────────────────

function TopesPanel() {
  const [data, setData] = useState<TopeHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getTopes()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudieron cargar los topes históricos.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(d =>
    !search || d.periodo.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const chartData = sorted.length > 0 ? {
    labels: sorted.slice(0, 24).reverse().map(d => d.periodo),
    datasets: [
      {
        label: 'Haber Mínimo',
        data: sorted.slice(0, 24).reverse().map(d => d.haber_minimo),
        backgroundColor: 'rgba(21,101,192,0.7)',
        borderColor: '#1565c0',
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: 'Haber Máximo',
        data: sorted.slice(0, 24).reverse().map(d => d.haber_maximo),
        backgroundColor: 'rgba(46,125,50,0.7)',
        borderColor: '#2e7d32',
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  } : null;

  const chartOptions: any = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: { label: (ctx: any) => fmt(ctx.raw) },
      },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `$${(v / 1000).toFixed(0)}k` } },
    },
  };

  if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Haberes mínimo y máximo históricos del sistema previsional argentino (SIPA).
      </Typography>

      {chartData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Evolución — Últimos 24 períodos
            </Typography>
            <Bar data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <TextField
            placeholder="Filtrar por período..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2, width: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
            }}
          />
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Haber Mínimo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Haber Máximo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Relación Máx/Mín</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map(d => (
                  <TableRow key={d.periodo} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{d.periodo}</TableCell>
                    <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {fmt(d.haber_minimo)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {fmt(d.haber_maximo)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${(d.haber_maximo / d.haber_minimo).toFixed(2)}x`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {sorted.length} registros
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Movilidad panel ─────────────────────────────────────────────────────────

function MovilidadPanel() {
  const [data, setData] = useState<MovilidadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMovilidadHistorica()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo cargar la tabla de movilidad.'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...data].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const filtered = sorted.filter(d =>
    !search || d.periodo.toLowerCase().includes(search.toLowerCase()) || d.ley.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = sorted.length > 0 ? {
    labels: sorted.slice(0, 20).reverse().map(d => d.periodo),
    datasets: [{
      label: '% de Aumento',
      data: sorted.slice(0, 20).reverse().map(d => d.pct),
      backgroundColor: sorted.slice(0, 20).map(d => d.pct > 0 ? 'rgba(46,125,50,0.7)' : 'rgba(198,40,40,0.7)'),
      borderColor: sorted.slice(0, 20).map(d => d.pct > 0 ? '#2e7d32' : '#c62828'),
      borderWidth: 1,
      borderRadius: 3,
    }],
  } : null;

  const chartOptions: any = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw.toFixed(2)}%` } },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `${v}%` } },
    },
  };

  if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Aumentos trimestrales/semestrales de movilidad previsional según Leyes 26.417, 27.426, 27.609 y 27.705.
      </Typography>

      {chartData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Porcentajes de Movilidad — Últimos 20 períodos
            </Typography>
            <Bar data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <TextField
            placeholder="Filtrar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2, width: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
            }}
          />
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vigente Desde</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">% Aumento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Coef. Acumulado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ley</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.periodo} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{d.periodo}</TableCell>
                    <TableCell>{d.desde}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${d.pct > 0 ? '+' : ''}${d.pct.toFixed(2)}%`}
                        size="small"
                        color={d.pct > 0 ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {d.coef_acum.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{d.ley}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {filtered.length} registros
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── RIPTE panel ─────────────────────────────────────────────────────────────

interface RipteRecord {
  periodo: string;
  valor: number;
  variacion_mensual?: number;
  variacion_anual?: number;
}

function RiptePanel() {
  const [data, setData] = useState<RipteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getRipteHistorico()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo cargar el histórico RIPTE.'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...data].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const filtered = sorted.filter(d =>
    !search || d.periodo.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = sorted.length > 0 ? {
    labels: sorted.slice(0, 24).reverse().map(d => d.periodo),
    datasets: [{
      label: 'RIPTE ($)',
      data: sorted.slice(0, 24).reverse().map(d => d.valor),
      borderColor: '#1565c0',
      backgroundColor: 'rgba(21,101,192,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    }],
  } : null;

  const chartOptions: any = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => fmt(ctx.raw) } },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `$${(v / 1000).toFixed(0)}k` } },
    },
  };

  if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Remuneración Imponible Promedio de los Trabajadores Estables (RIPTE) — INDEC/MTEySS.
        Utilizado para actualización de haberes y cálculo PC.
      </Typography>

      {chartData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Evolución RIPTE — Últimos 24 períodos
            </Typography>
            <Line data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <TextField
            placeholder="Filtrar por período..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2, width: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
            }}
          />
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Valor RIPTE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Var. Mensual</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Var. Anual</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.periodo} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{d.periodo}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {fmt(d.valor)}
                    </TableCell>
                    <TableCell align="right">
                      {d.variacion_mensual != null ? (
                        <Chip
                          label={`${d.variacion_mensual > 0 ? '+' : ''}${d.variacion_mensual.toFixed(2)}%`}
                          size="small"
                          color={d.variacion_mensual >= 0 ? 'success' : 'error'}
                          variant="outlined"
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {d.variacion_anual != null ? (
                        <Chip
                          label={`${d.variacion_anual > 0 ? '+' : ''}${d.variacion_anual.toFixed(2)}%`}
                          size="small"
                          color={d.variacion_anual >= 0 ? 'success' : 'error'}
                        />
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {filtered.length} registros
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Tasas panel ─────────────────────────────────────────────────────────────

interface TasaRecord {
  periodo: string;
  tasa_activa_bna?: number;
  tasa_pasiva_bna?: number;
  tasa_cna?: number;
  tasa_punitorios?: number;
  fuente?: string;
}

function TasasPanel() {
  const [data, setData] = useState<TasaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getTasasInteres()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudieron cargar las tasas de interés.'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...data].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const filtered = sorted.filter(d =>
    !search || d.periodo.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = sorted.length > 0 ? {
    labels: sorted.slice(0, 24).reverse().map(d => d.periodo),
    datasets: [
      {
        label: 'Tasa Activa BNA',
        data: sorted.slice(0, 24).reverse().map(d => d.tasa_activa_bna ?? null),
        borderColor: '#1565c0',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: 'Tasa Pasiva BNA',
        data: sorted.slice(0, 24).reverse().map(d => d.tasa_pasiva_bna ?? null),
        borderColor: '#2e7d32',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: 'Tasa CNA',
        data: sorted.slice(0, 24).reverse().map(d => d.tasa_cna ?? null),
        borderColor: '#e65100',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  } : null;

  const chartOptions: any = {
    responsive: true,
    plugins: { legend: { position: 'top' as const }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw?.toFixed(4) ?? '—'}%` } } },
    scales: { y: { ticks: { callback: (v: any) => `${v}%` } } },
  };

  if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Tasas de interés aplicables en ejecuciones de sentencia previsionales.
        Resolución 589/2019 ANSES, Tasa Activa BNA, CNA y punitorias.
      </Typography>

      {chartData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Evolución de Tasas — Últimos 24 períodos
            </Typography>
            <Line data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <TextField
            placeholder="Filtrar por período..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2, width: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
            }}
          />
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">T. Activa BNA</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">T. Pasiva BNA</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">CNA</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Punitorios</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fuente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.periodo} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{d.periodo}</TableCell>
                    <TableCell align="right">{d.tasa_activa_bna != null ? `${d.tasa_activa_bna.toFixed(4)}%` : '—'}</TableCell>
                    <TableCell align="right">{d.tasa_pasiva_bna != null ? `${d.tasa_pasiva_bna.toFixed(4)}%` : '—'}</TableCell>
                    <TableCell align="right">{d.tasa_cna != null ? `${d.tasa_cna.toFixed(4)}%` : '—'}</TableCell>
                    <TableCell align="right">{d.tasa_punitorios != null ? `${d.tasa_punitorios.toFixed(4)}%` : '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{d.fuente || '—'}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {filtered.length} registros
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HerramientasPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Herramientas Previsionales</Typography>
        <Typography color="text.secondary" variant="body2">
          Tablas de referencia del sistema SIPA — actualizadas según normativa vigente
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <MonetizationOn sx={{ color: '#1565c0' }} />, label: 'Topes Históricos', desc: 'Mín. y Máx. por período', color: '#e3f2fd', tab: 0 },
          { icon: <TrendingUp sx={{ color: '#2e7d32' }} />, label: 'Movilidad SIPA', desc: 'Ajustes trimestrales', color: '#e8f5e9', tab: 1 },
          { icon: <TableChart sx={{ color: '#e65100' }} />, label: 'RIPTE Histórico', desc: 'Índice actualizador', color: '#fff3e0', tab: 2 },
          { icon: <Percent sx={{ color: '#6a1b9a' }} />, label: 'Tasas de Interés', desc: 'BNA, CNA, punitorios', color: '#f3e5f5', tab: 3 },
        ].map(item => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Card
              sx={{ cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 3 }, border: tab === item.tab ? '2px solid #1565c0' : undefined }}
              onClick={() => setTab(item.tab)}
            >
              <CardContent sx={{ pb: '16px !important' }}>
                <Box sx={{ bgcolor: item.color, borderRadius: 1.5, p: 1, display: 'inline-flex', mb: 1 }}>
                  {item.icon}
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Topes (Mín/Máx)" icon={<MonetizationOn />} iconPosition="start" />
          <Tab label="Movilidad SIPA" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="RIPTE" icon={<TableChart />} iconPosition="start" />
          <Tab label="Tasas de Interés" icon={<Percent />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}><TopesPanel /></TabPanel>
      <TabPanel value={tab} index={1}><MovilidadPanel /></TabPanel>
      <TabPanel value={tab} index={2}><RiptePanel /></TabPanel>
      <TabPanel value={tab} index={3}><TasasPanel /></TabPanel>
    </Box>
  );
}
