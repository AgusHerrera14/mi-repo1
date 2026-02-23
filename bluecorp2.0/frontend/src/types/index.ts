export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: 'admin' | 'operador' | 'supervisor' | 'consultor';
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
  nombre_conyuge?: string;
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
  numero_expediente?: string;
  fecha_alta?: string;
  fecha_baja?: string;
  motivo_baja?: string;
  zona?: string;
  banco?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  cbu?: string;
  alias_cbu?: string;
  forma_pago?: string;
  porcentaje_incapacidad?: number;
  organismo_certifica_incapacidad?: string;
  anios_aportes_pre_sijp: number;
  anios_aportes_post_sijp: number;
  promedio_remuneraciones: number;
  pbu_calculada: number;
  pc_calculada: number;
  pap_calculada: number;
  complemento_zona: number;
  haber_inicial: number;
  haber_actual: number;
  observaciones?: string;
  periodos_laborales: PeriodoLaboral[];
  remuneraciones: Remuneracion[];
  descuentos_voluntarios: DescuentoVoluntario[];
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
  provincia?: string;
  forma_pago?: string;
}

export interface PeriodoLaboral {
  id?: number;
  afiliado_id?: number;
  empleador: string;
  cuit_empleador?: string;
  actividad?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  categoria?: string;
  convenio_colectivo?: string;
  tipo_relacion: string;
  aportes_verificados: boolean;
  fuente_verificacion?: string;
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
  es_sac?: boolean;
}

export interface DescuentoVoluntario {
  id?: number;
  afiliado_id?: number;
  tipo: string;
  descripcion: string;
  beneficiario?: string;
  modalidad: string;
  importe_fijo: number;
  porcentaje: number;
  activo: boolean;
  prioridad: number;
  created_at?: string;
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
  complemento_zona: number;
  haber_bruto: number;
  haber_minimo_garantizado: number;
  coeficiente_movilidad: number;
  porcentaje_movilidad: number;
  haber_con_movilidad: number;
  importe_novedades: number;
  importe_sac: number;
  meses_retroactivo: number;
  importe_retroactivo: number;
  periodo_retro_desde?: string;
  periodo_retro_hasta?: string;
  descuento_pami: number;
  descuento_sindicato: number;
  descuento_mutual: number;
  descuento_embargo: number;
  descuento_otro: number;
  total_descuentos: number;
  haber_neto: number;
  banco_pago?: string;
  cbu_pago?: string;
  forma_pago?: string;
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

export interface Expediente {
  id: number;
  afiliado_id: number;
  numero_expediente: string;
  tipo_tramite: string;
  estado: string;
  fecha_inicio: string;
  fecha_resolucion?: string;
  numero_resolucion?: string;
  solicitante_nombre?: string;
  es_apoderado: boolean;
  doc_dni: boolean;
  doc_partida_nacimiento: boolean;
  doc_certificados_aportes: boolean;
  doc_declaracion_jurada: boolean;
  doc_certificado_laboral: boolean;
  doc_partida_matrimonio: boolean;
  doc_certificado_medico: boolean;
  observaciones?: string;
  movimientos: MovimientoExpediente[];
  created_at?: string;
}

export interface MovimientoExpediente {
  id: number;
  expediente_id: number;
  fecha?: string;
  tipo: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  descripcion: string;
  usuario_id?: number;
}

export interface Novedad {
  id: number;
  afiliado_id: number;
  tipo: string;
  descripcion: string;
  periodo_desde?: string;
  periodo_hasta?: string;
  importe_impacto: number;
  impacta_haber: boolean;
  estado: string;
  numero_resolucion?: string;
  observaciones?: string;
  created_at?: string;
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
  alertas: {
    novedades_pendientes: number;
    expedientes_activos: number;
  };
  distribucion_por_tipo: { tipo: string; cantidad: number }[];
  distribucion_por_provincia: { provincia: string; cantidad: number }[];
  distribucion_por_zona: { zona: string; cantidad: number }[];
}
