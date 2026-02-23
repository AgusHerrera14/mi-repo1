from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional, List
from datetime import date, datetime
import re


class PeriodoLaboralCreate(BaseModel):
    empleador: str
    cuit_empleador: Optional[str] = None
    actividad: Optional[str] = None
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    categoria: Optional[str] = None
    convenio_colectivo: Optional[str] = None
    tipo_relacion: str = "dependencia"
    aportes_verificados: bool = False
    fuente_verificacion: Optional[str] = None
    observaciones: Optional[str] = None


class PeriodoLaboralResponse(PeriodoLaboralCreate):
    id: int
    afiliado_id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class RemuneracionCreate(BaseModel):
    periodo: str
    remuneracion_bruta: float
    remuneracion_imponible: float
    aporte_personal: Optional[float] = None
    contribucion_patronal: Optional[float] = None
    ingresado_anses: bool = False
    es_sac: bool = False

    @field_validator("periodo")
    @classmethod
    def validar_periodo(cls, v):
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError("Formato YYYY-MM requerido")
        return v

    @field_validator("remuneracion_bruta", "remuneracion_imponible")
    @classmethod
    def no_negativo(cls, v):
        if v < 0:
            raise ValueError("El importe no puede ser negativo")
        return v


class RemuneracionResponse(RemuneracionCreate):
    id: int
    afiliado_id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class DescuentoVoluntarioCreate(BaseModel):
    tipo: str
    descripcion: str
    beneficiario: Optional[str] = None
    cuit_beneficiario: Optional[str] = None
    numero_convenio: Optional[str] = None
    modalidad: str = "fijo"
    importe_fijo: float = 0.0
    porcentaje: float = 0.0
    base_calculo: str = "haber_neto"
    total_cuotas: int = 0
    cuotas_pagadas: int = 0
    importe_total: float = 0.0
    importe_por_cuota: float = 0.0
    saldo_pendiente: float = 0.0
    activo: bool = True
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    prioridad: int = 1
    observaciones: Optional[str] = None


class DescuentoVoluntarioResponse(DescuentoVoluntarioCreate):
    id: int
    afiliado_id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class AffiliateBase(BaseModel):
    cuil: str
    dni: str
    apellido: str
    nombre: str
    fecha_nacimiento: date
    sexo: str
    estado_civil: Optional[str] = "soltero"
    nacionalidad: Optional[str] = "Argentina"
    nombre_conyuge: Optional[str] = None
    domicilio: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    tipo_prestacion: str
    zona: Optional[str] = "normal"
    banco: Optional[str] = None
    tipo_cuenta: Optional[str] = None
    numero_cuenta: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    forma_pago: Optional[str] = "acreditacion"
    porcentaje_incapacidad: Optional[float] = None
    organismo_certifica_incapacidad: Optional[str] = None
    fecha_dictamen_invalidez: Optional[date] = None
    observaciones: Optional[str] = None

    @field_validator("cuil")
    @classmethod
    def validar_cuil(cls, v):
        cuil = v.replace("-", "").replace(" ", "")
        if len(cuil) != 11 or not cuil.isdigit():
            raise ValueError("CUIL debe tener 11 dígitos")
        return cuil

    @field_validator("sexo")
    @classmethod
    def validar_sexo(cls, v):
        if v.upper() not in ("M", "F"):
            raise ValueError("Sexo debe ser 'M' o 'F'")
        return v.upper()


class AffiliateCreate(AffiliateBase):
    periodos_laborales: Optional[List[PeriodoLaboralCreate]] = []
    remuneraciones: Optional[List[RemuneracionCreate]] = []


class AffiliateUpdate(BaseModel):
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    estado_civil: Optional[str] = None
    nombre_conyuge: Optional[str] = None
    domicilio: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    estado: Optional[str] = None
    motivo_baja: Optional[str] = None
    fecha_baja: Optional[date] = None
    zona: Optional[str] = None
    banco: Optional[str] = None
    tipo_cuenta: Optional[str] = None
    numero_cuenta: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    forma_pago: Optional[str] = None
    observaciones: Optional[str] = None


class AffiliateResponse(AffiliateBase):
    id: int
    estado: str
    numero_beneficio: Optional[str] = None
    numero_expediente: Optional[str] = None
    fecha_alta: Optional[date] = None
    fecha_baja: Optional[date] = None
    anios_aportes_pre_sijp: float
    anios_aportes_post_sijp: float
    promedio_remuneraciones: float
    pbu_calculada: float
    pc_calculada: float
    pap_calculada: float
    complemento_zona: float
    haber_inicial: float
    haber_actual: float
    created_at: Optional[datetime] = None
    periodos_laborales: List[PeriodoLaboralResponse] = []
    remuneraciones: List[RemuneracionResponse] = []
    descuentos_voluntarios: List[DescuentoVoluntarioResponse] = []

    class Config:
        from_attributes = True


class AffiliateSummary(BaseModel):
    id: int
    cuil: str
    apellido: str
    nombre: str
    tipo_prestacion: str
    estado: str
    haber_actual: float
    numero_beneficio: Optional[str] = None
    provincia: Optional[str] = None
    forma_pago: Optional[str] = None

    class Config:
        from_attributes = True
