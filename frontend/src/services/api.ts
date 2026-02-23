import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AuthToken, User, Affiliate, AffiliateSummary,
  Liquidacion, LiquidacionSummary, RIPTERecord,
  MovilidadRecord, DashboardStats, PeriodoLaboral, Remuneracion
} from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (r) => r,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  async login(username: string, password: string): Promise<AuthToken> {
    const { data } = await this.client.post<AuthToken>('/auth/login', { username, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  // ── Afiliados ───────────────────────────────────────────────────────────
  async getAfiliados(params?: {
    skip?: number; limit?: number; estado?: string;
    tipo_prestacion?: string; busqueda?: string;
  }): Promise<AffiliateSummary[]> {
    const { data } = await this.client.get<AffiliateSummary[]>('/affiliates/', { params });
    return data;
  }

  async getAfiliado(id: number): Promise<Affiliate> {
    const { data } = await this.client.get<Affiliate>(`/affiliates/${id}`);
    return data;
  }

  async crearAfiliado(affiliate: Partial<Affiliate>): Promise<Affiliate> {
    const { data } = await this.client.post<Affiliate>('/affiliates/', affiliate);
    return data;
  }

  async actualizarAfiliado(id: number, affiliate: Partial<Affiliate>): Promise<Affiliate> {
    const { data } = await this.client.put<Affiliate>(`/affiliates/${id}`, affiliate);
    return data;
  }

  async eliminarAfiliado(id: number): Promise<void> {
    await this.client.delete(`/affiliates/${id}`);
  }

  async agregarPeriodo(afiliadoId: number, periodo: Partial<PeriodoLaboral>): Promise<PeriodoLaboral> {
    const { data } = await this.client.post<PeriodoLaboral>(`/affiliates/${afiliadoId}/periodos`, periodo);
    return data;
  }

  async agregarRemuneracion(afiliadoId: number, rem: Partial<Remuneracion>): Promise<Remuneracion> {
    const { data } = await this.client.post<Remuneracion>(`/affiliates/${afiliadoId}/remuneraciones`, rem);
    return data;
  }

  async recalcularAfiliado(id: number): Promise<Affiliate> {
    const { data } = await this.client.post<Affiliate>(`/affiliates/${id}/recalcular`);
    return data;
  }

  async getResumenAfiliados(): Promise<any> {
    const { data } = await this.client.get('/affiliates/stats/resumen');
    return data;
  }

  // ── Liquidaciones ───────────────────────────────────────────────────────
  async getLiquidaciones(params?: {
    skip?: number; limit?: number; afiliado_id?: number;
    periodo?: string; estado?: string;
  }): Promise<LiquidacionSummary[]> {
    const { data } = await this.client.get<LiquidacionSummary[]>('/liquidations/', { params });
    return data;
  }

  async getLiquidacion(id: number): Promise<Liquidacion> {
    const { data } = await this.client.get<Liquidacion>(`/liquidations/${id}`);
    return data;
  }

  async crearLiquidacion(liq: {
    afiliado_id: number; tipo: string; periodo: string;
    fecha_pago?: string; observaciones?: string;
  }): Promise<Liquidacion> {
    const { data } = await this.client.post<Liquidacion>('/liquidations/', liq);
    return data;
  }

  async calcularPrevio(req: { afiliado_id: number; periodo: string }): Promise<any> {
    const { data } = await this.client.post('/liquidations/calcular', req);
    return data;
  }

  async autorizarLiquidacion(id: number): Promise<Liquidacion> {
    const { data } = await this.client.post<Liquidacion>(`/liquidations/${id}/autorizar`);
    return data;
  }

  async anularLiquidacion(id: number): Promise<Liquidacion> {
    const { data } = await this.client.post<Liquidacion>(`/liquidations/${id}/anular`);
    return data;
  }

  async getResumenLiquidaciones(): Promise<any> {
    const { data } = await this.client.get('/liquidations/stats/resumen');
    return data;
  }

  // ── RIPTE ───────────────────────────────────────────────────────────────
  async getRIPTE(params?: { desde?: string; hasta?: string; limit?: number }): Promise<RIPTERecord[]> {
    const { data } = await this.client.get<RIPTERecord[]>('/ripte/', { params });
    return data;
  }

  async getUltimoRIPTE(): Promise<{ periodo: string; valor: number }> {
    const { data } = await this.client.get('/ripte/ultimo');
    return data;
  }

  async cargarRIPTEHistorico(): Promise<any> {
    const { data } = await this.client.post('/ripte/cargar-historico');
    return data;
  }

  // ── Movilidad ───────────────────────────────────────────────────────────
  async getTablaMovilidad(): Promise<MovilidadRecord[]> {
    const { data } = await this.client.get<MovilidadRecord[]>('/movilidad/tabla');
    return data;
  }

  async getUltimoCoeficiente(): Promise<MovilidadRecord> {
    const { data } = await this.client.get<MovilidadRecord>('/movilidad/ultimo');
    return data;
  }

  async simularMovilidad(haberActual: number, periodosProyeccion: number, tasaEstimada: number): Promise<any> {
    const { data } = await this.client.get('/movilidad/simulador', {
      params: { haber_actual: haberActual, periodos_proyeccion: periodosProyeccion, tasa_estimada: tasaEstimada }
    });
    return data;
  }

  // ── Reportes ─────────────────────────────────────────────────────────────
  async getDashboard(): Promise<DashboardStats> {
    const { data } = await this.client.get<DashboardStats>('/reports/dashboard');
    return data;
  }

  async getAfiliadosPorTipo(): Promise<any[]> {
    const { data } = await this.client.get('/reports/afiliados/por-tipo');
    return data;
  }

  async getLiquidacionesPorPeriodo(anio: number): Promise<any[]> {
    const { data } = await this.client.get('/reports/liquidaciones/por-periodo', { params: { anio } });
    return data;
  }

  async getHaberesPorRango(): Promise<any> {
    const { data } = await this.client.get('/reports/haberes/rango');
    return data;
  }

  // ── Usuarios ─────────────────────────────────────────────────────────────
  async getUsuarios(): Promise<User[]> {
    const { data } = await this.client.get<User[]>('/users/');
    return data;
  }

  async getMe(): Promise<User> {
    const { data } = await this.client.get<User>('/users/me');
    return data;
  }
}

export const api = new ApiService();
export default api;
