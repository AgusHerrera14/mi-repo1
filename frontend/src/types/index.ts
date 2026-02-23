export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: 'admin' | 'operador' | 'consultor';
  is_active: boolean;
  created_at?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Affiliate {
  id: number;
  cuil: string;
  dni: string;
  apellido: string;
  nombre: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'F';
  estado_civil?: string;
  nacionalidad?: string;
  domicilio?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  tipo_prestacion: string;
  estado: string;
  numero_beneficio?: string;
  fecha_alta?: string;
  banco?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  cbu?: string;
  alias_cbu?: string;
  anios_aportes_pre_sijp: number;
  anios_aportes_post_sijp: number;
  promedio_remuneraciones: number;
  pbu_calculada: number;
  pc_calculada: number;
  pap_calculada: number;
  haber_inicial: number;
  haber_actual: number;
  observaciones?: string;
  periodos_laborales: PeriodoLaboral[];
  remuneraciones: Remuneracion[];
  created_at?: string;
}

export interface AffiliateSummary {
  id: number;
  cuil: string;
  apellido: string;
  nombre: string;
  tipo_prestacion: string;
  estado: string;
  haber_actual: number;
  numero_beneficio?: string;
}

export interface PeriodoLaboral {
  id?: number;
  afiliado_id?: number;
  empleador: string;
  cuit_empleador?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  categoria?: string;
  convenio_colectivo?: string;
  tipo_relacion: string;
  aportes_verificados: boolean;
  observaciones?: string;
}

export interface Remuneracion {
  id?: number;
  afiliado_id?: number;
  periodo: string;
  remuneracion_bruta: number;
  remuneracion_imponible: number;
  aporte_personal?: number;
  contribucion_patronal?: number;
  ingresado_anses: boolean;
}

export interface Liquidacion {
  id: number;
  afiliado_id: number;
  numero_liquidacion?: string;
  tipo: string;
  estado: string;
  periodo: string;
  fecha_pago?: string;
  pbu: number;
  pc: number;
  pap: number;
  haber_bruto: number;
  haber_minimo_garantizado: number;
  coeficiente_movilidad: number;
  haber_con_movilidad: number;
  descuento_obra_social: number;
  descuento_otro: number;
  total_descuentos: number;
  meses_retroactivo: number;
  importe_retroactivo: number;
  haber_neto: number;
  banco_pago?: string;
  cbu_pago?: string;
  observaciones?: string;
  items: ItemLiquidacion[];
  created_at?: string;
}

export interface LiquidacionSummary {
  id: number;
  afiliado_id: number;
  numero_liquidacion?: string;
  periodo: string;
  tipo: string;
  estado: string;
  haber_neto: number;
}

export interface ItemLiquidacion {
  concepto: string;
  codigo_concepto?: string;
  tipo: 'haber' | 'descuento';
  importe: number;
  porcentaje?: number;
  base_calculo?: number;
  observacion?: string;
}

export interface RIPTERecord {
  id: number;
  periodo: string;
  valor: number;
  variacion_mensual?: number;
  variacion_trimestral?: number;
  variacion_anual?: number;
  fuente: string;
}

export interface MovilidadRecord {
  periodo: string;
  desde: string;
  pct: number;
  ley: string;
  coef_acum: number;
}

export interface DashboardStats {
  afiliados: {
    total: number;
    activos: number;
    pasivos: number;
    solicitantes: number;
    haber_promedio: number;
    haber_total_mensual: number;
  };
  liquidaciones: {
    total: number;
    autorizadas: number;
    pagadas: number;
    masa_pagada: number;
  };
  distribucion_por_tipo: { tipo: string; cantidad: number }[];
  distribucion_por_provincia: { provincia: string; cantidad: number }[];
}
