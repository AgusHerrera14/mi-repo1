import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = async (username: string, password: string) => {
  const r = await api.post('/auth/login', new URLSearchParams({ username, password }));
  localStorage.setItem('token', r.data.access_token);
  localStorage.setItem('user', JSON.stringify(r.data.user));
  return r;
};
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
export const getCurrentUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
export const getMe = () => api.get('/users/me');

// Fichas
export const getFichas = (search?: string) =>
  api.get('/fichas/', { params: search ? { search } : {} });
export const createFicha = (data: any) => api.post('/fichas/', data);
export const getFicha = (id: string) => api.get(`/fichas/${id}`);
export const updateFicha = (id: string, data: any) => api.put(`/fichas/${id}`, data);
export const deleteFicha = (id: string) => api.delete(`/fichas/${id}`);

// Servicios
export const addServicio = (fichaId: string, data: any) =>
  api.post(`/fichas/${fichaId}/servicios`, data);
export const deleteServicio = (fichaId: string, servicioId: number) =>
  api.delete(`/fichas/${fichaId}/servicios/${servicioId}`);

// Remuneraciones
export const addRemuneracion = (fichaId: string, data: any) =>
  api.post(`/fichas/${fichaId}/remuneraciones`, data);
export const updateRemuneracion = (fichaId: string, remId: number, data: any) =>
  api.put(`/fichas/${fichaId}/remuneraciones/${remId}`, data);
export const deleteRemuneracion = (fichaId: string, remId: number) =>
  api.delete(`/fichas/${fichaId}/remuneraciones/${remId}`);

// Cálculos
export const calcularDerecho = (fichaId: string, fechaCalculo?: string) =>
  api.post('/calculos/derecho', { ficha_id: fichaId, fecha_calculo: fechaCalculo });
export const calcularHaber = (fichaId: string, tipoCalculo: string = 'estimado', fechaCalculo?: string) =>
  api.post('/calculos/haber', { ficha_id: fichaId, tipo_calculo: tipoCalculo, fecha_calculo: fechaCalculo });
export const calcularReajuste = (data: any) => api.post('/calculos/reajuste', data);
export const getHistorialCalculos = (fichaId: string) =>
  api.get(`/calculos/historial/${fichaId}`);

// Herramientas
export const getTopes = () => api.get('/herramientas/topes');
export const getRipteHistorico = () => api.get('/herramientas/ripte');
export const getMovilidadHistorica = () => api.get('/herramientas/movilidad');
export const getTasasInteres = () => api.get('/herramientas/tasas-interes');
export const getValoresVigentes = () => api.get('/herramientas/vigente');

export default api;
