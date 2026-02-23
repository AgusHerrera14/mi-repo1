import axios from 'axios';
import {
  AuthToken, User, Affiliate, AffiliateSummary, Liquidacion, LiquidacionSummary,
  RIPTERecord, MovilidadRecord, DashboardStats, Expediente, Novedad
} from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({ baseURL: BASE_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const api = {
  // Auth
  login: async (username: string, password: string): Promise<AuthToken> => {
    const fd = new FormData();
    fd.append('username', username);
    fd.append('password', password);
    const { data } = await axiosInstance.post<AuthToken>('/auth/login', fd);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
  getCurrentUser: (): User | null => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await axiosInstance.get<DashboardStats>('/reports/dashboard');
    return data;
  },

  // Afiliados
  getAfiliados: async (params?: { skip?: number; limit?: number; search?: string; estado?: string; tipo?: string }): Promise<AffiliateSummary[]> => {
    const { data } = await axiosInstance.get<AffiliateSummary[]>('/affiliates', { params });
    return data;
  },
  getAfiliado: async (id: number): Promise<Affiliate> => {
    const { data } = await axiosInstance.get<Affiliate>(`/affiliates/${id}`);
    return data;
  },
  createAfiliado: async (body: Partial<Affiliate>): Promise<Affiliate> => {
    const { data } = await axiosInstance.post<Affiliate>('/affiliates', body);
    return data;
  },
  updateAfiliado: async (id: number, body: Partial<Affiliate>): Promise<Affiliate> => {
    const { data } = await axiosInstance.put<Affiliate>(`/affiliates/${id}`, body);
    return data;
  },
  deleteAfiliado: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/affiliates/${id}`);
  },

  // Liquidaciones
  getLiquidaciones: async (params?: { afiliado_id?: number; periodo?: string; tipo?: string; estado?: string; skip?: number; limit?: number }): Promise<LiquidacionSummary[]> => {
    const { data } = await axiosInstance.get<LiquidacionSummary[]>('/liquidations', { params });
    return data;
  },
  getLiquidacion: async (id: number): Promise<Liquidacion> => {
    const { data } = await axiosInstance.get<Liquidacion>(`/liquidations/${id}`);
    return data;
  },
  calcularLiquidacion: async (body: { afiliado_id: number; periodo: string; tipo?: string }): Promise<Liquidacion> => {
    const { data } = await axiosInstance.post<Liquidacion>('/liquidations/calcular', body);
    return data;
  },
  guardarLiquidacion: async (liq: Partial<Liquidacion>): Promise<Liquidacion> => {
    const { data } = await axiosInstance.post<Liquidacion>('/liquidations', liq);
    return data;
  },
  autorizarLiquidacion: async (id: number): Promise<Liquidacion> => {
    const { data } = await axiosInstance.post<Liquidacion>(`/liquidations/${id}/autorizar`);
    return data;
  },
  anularLiquidacion: async (id: number, motivo: string): Promise<Liquidacion> => {
    const { data } = await axiosInstance.post<Liquidacion>(`/liquidations/${id}/anular`, { motivo });
    return data;
  },
  calcularSAC: async (body: { afiliado_id: number; semestre: number; anio: number }): Promise<any> => {
    const { data } = await axiosInstance.post('/liquidations/sac', body);
    return data;
  },
  calcularRetroactivo: async (body: { afiliado_id: number; periodo_desde: string; periodo_hasta: string; haber_base_inicio: number }): Promise<any> => {
    const { data } = await axiosInstance.post('/liquidations/retroactivo', body);
    return data;
  },
  getReciboPDF: async (id: number): Promise<Blob> => {
    const { data } = await axiosInstance.get(`/liquidations/${id}/recibo`, { responseType: 'blob' });
    return data;
  },
  downloadRecibo: async (id: number, nombre: string) => {
    const blob = await api.getReciboPDF(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo_${nombre}_${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // RIPTE
  getRIPTE: async (params?: { limit?: number; offset?: number }): Promise<RIPTERecord[]> => {
    const { data } = await axiosInstance.get<RIPTERecord[]>('/ripte', { params });
    return data;
  },
  cargarRIPTEHistorico: async (): Promise<any> => {
    const { data } = await axiosInstance.post('/ripte/cargar-historico');
    return data;
  },

  // Movilidad
  getTablaMovilidad: async (): Promise<MovilidadRecord[]> => {
    const { data } = await axiosInstance.get<MovilidadRecord[]>('/movilidad/tabla');
    return data;
  },
  simularMovilidad: async (haber_base: number, meses: number, tasa_mensual: number): Promise<any> => {
    const { data } = await axiosInstance.post('/movilidad/simular', { haber_base, meses, tasa_mensual });
    return data;
  },

  // Expedientes
  getExpedientes: async (params?: { afiliado_id?: number; estado?: string; tipo_tramite?: string; skip?: number; limit?: number }): Promise<Expediente[]> => {
    const { data } = await axiosInstance.get<Expediente[]>('/expedientes', { params });
    return data;
  },
  getExpediente: async (id: number): Promise<Expediente> => {
    const { data } = await axiosInstance.get<Expediente>(`/expedientes/${id}`);
    return data;
  },
  createExpediente: async (body: Partial<Expediente>): Promise<Expediente> => {
    const { data } = await axiosInstance.post<Expediente>('/expedientes', body);
    return data;
  },
  updateExpediente: async (id: number, body: Partial<Expediente>): Promise<Expediente> => {
    const { data } = await axiosInstance.put<Expediente>(`/expedientes/${id}`, body);
    return data;
  },
  addMovimientoExpediente: async (id: number, body: { tipo: string; descripcion: string; estado_nuevo?: string }): Promise<Expediente> => {
    const { data } = await axiosInstance.post<Expediente>(`/expedientes/${id}/movimientos`, body);
    return data;
  },

  // Novedades
  getNovedades: async (params?: { afiliado_id?: number; estado?: string; tipo?: string; skip?: number; limit?: number }): Promise<Novedad[]> => {
    const { data } = await axiosInstance.get<Novedad[]>('/novedades', { params });
    return data;
  },
  getNovedad: async (id: number): Promise<Novedad> => {
    const { data } = await axiosInstance.get<Novedad>(`/novedades/${id}`);
    return data;
  },
  createNovedad: async (body: Partial<Novedad>): Promise<Novedad> => {
    const { data } = await axiosInstance.post<Novedad>('/novedades', body);
    return data;
  },
  updateNovedad: async (id: number, body: Partial<Novedad>): Promise<Novedad> => {
    const { data } = await axiosInstance.put<Novedad>(`/novedades/${id}`, body);
    return data;
  },
  aplicarNovedad: async (id: number): Promise<Novedad> => {
    const { data } = await axiosInstance.post<Novedad>(`/novedades/${id}/aplicar`);
    return data;
  },

  // Reports
  exportarAfiliados: async (formato: 'xlsx' | 'csv'): Promise<Blob> => {
    const { data } = await axiosInstance.get(`/reports/afiliados/export?formato=${formato}`, { responseType: 'blob' });
    return data;
  },
  exportarLiquidaciones: async (periodo: string, formato: 'xlsx' | 'csv'): Promise<Blob> => {
    const { data } = await axiosInstance.get(`/reports/liquidaciones/export?periodo=${periodo}&formato=${formato}`, { responseType: 'blob' });
    return data;
  },

  // Users (admin)
  getUsers: async (): Promise<User[]> => {
    const { data } = await axiosInstance.get<User[]>('/users');
    return data;
  },
  createUser: async (body: Partial<User> & { password: string }): Promise<User> => {
    const { data } = await axiosInstance.post<User>('/users', body);
    return data;
  },
  updateUser: async (id: number, body: Partial<User>): Promise<User> => {
    const { data } = await axiosInstance.put<User>(`/users/${id}`, body);
    return data;
  },
};

export default api;
