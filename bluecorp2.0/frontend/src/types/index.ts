export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
}

export interface Servicio {
  id: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo: string;
  regimen: string;
  empleador: string | null;
  cuit_empleador: string | null;
  porcentaje: number;
  nota: string | null;
}

export interface Remuneracion {
  id: number;
  periodo: string;
  importe_nominal: number;
  importe_actualizado: number | null;
  factor_actualizacion: number | null;
  indice_actualizacion: string | null;
  tipo: string;
  empleador: string | null;
  nota: string | null;
}

export interface Ficha {
  id: string;
  numero: string | null;
  apellido_nombre: string;
  cuil: string;
  dni: string | null;
  fecha_nacimiento: string;
  sexo: string;
  domicilio: string | null;
  localidad: string | null;
  provincia: string | null;
  email: string | null;
  telefono: string | null;
  tipo_beneficio: string;
  fecha_cese: string | null;
  fecha_calculo: string | null;
  observaciones_generales: string | null;
  estado: string;
  servicios: Servicio[];
  remuneraciones: Remuneracion[];
  created_at: string;
}

export interface FichaListItem {
  id: string;
  numero: string | null;
  apellido_nombre: string;
  cuil: string;
  tipo_beneficio: string;
  estado: string;
  fecha_calculo: string | null;
  created_at: string;
}

export interface ResultadoDerecho {
  tiene_derecho: boolean;
  cumple_edad: boolean;
  cumple_aportes: boolean;
  cumple_regularidad: boolean;
  edad_actual: number;
  edad_requerida: number;
  meses_faltantes_edad: number;
  anios_totales: number;
  anios_pre_sijp: number;
  anios_post_sijp: number;
  meses_faltantes_aportes: number;
  porcentaje_regularidad: number;
  diagnostico: string;
  observaciones: string[];
  detalle: Record<string, any>;
}

export interface ResultadoHaber {
  tiene_derecho: boolean;
  pbu: number;
  pc: number;
  pap: number;
  pap_transitoria: number;
  haber_bruto: number;
  haber_minimo_vigente: number;
  haber_maximo_vigente: number;
  haber_final: number;
  complemento_minimo: number;
  pbci: number;
  anios_pre_sijp: number;
  anios_post_sijp: number;
  anios_totales: number;
  tipo_calculo: string;
  observaciones: string[];
  detalle: Record<string, any>;
}

export interface DiferenciaMensual {
  periodo: string;
  haber_percibido: number;
  haber_reajustado: number;
  diferencia: number;
  porcentaje_reajuste: number;
  coeficiente: number;
}

export interface ResultadoReajuste {
  diferencias: DiferenciaMensual[];
  retroactivo_bruto: number;
  intereses_punitorios: number;
  intereses_resarcitorios: number;
  total_credito: number;
  meses_calculados: number;
  meses_con_diferencia: number;
  observaciones: string[];
  detalle: Record<string, any>;
}

export interface TopeHistorico {
  periodo: string;
  haber_minimo: number;
  haber_maximo: number;
}

export interface MovilidadItem {
  periodo: string;
  desde: string;
  pct: number;
  ley: string;
  coef_acum: number;
}
