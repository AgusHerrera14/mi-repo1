from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class PeriodoLaboralCreate(BaseModel):
    empleador: str
    cuit_empleador: Optional[str] = None
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    categoria: Optional[str] = None
    convenio_colectivo: Optional[str] = None
    tipo_relacion: str = "dependencia"
    aportes_verificados: bool = False
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

    @field_validator("periodo")
    @classmethod
    def validar_periodo(cls, v: str) -> str:
        import re
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError("El período debe tener formato YYYY-MM")
        return v

    @field_validator("remuneracion_bruta", "remuneracion_imponible")
    @classmethod
    def validar_importe(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El importe no puede ser negativo")
        return v


class RemuneracionResponse(RemuneracionCreate):
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
    domicilio: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    tipo_prestacion: str
    banco: Optional[str] = None
    tipo_cuenta: Optional[str] = None
    numero_cuenta: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    observaciones: Optional[str] = None

    @field_validator("cuil")
    @classmethod
    def validar_cuil(cls, v: str) -> str:
        cuil = v.replace("-", "").replace(" ", "")
        if len(cuil) != 11 or not cuil.isdigit():
            raise ValueError("El CUIL debe tener 11 dígitos")
        return cuil

    @field_validator("sexo")
    @classmethod
    def validar_sexo(cls, v: str) -> str:
        if v.upper() not in ("M", "F"):
            raise ValueError("El sexo debe ser 'M' o 'F'")
        return v.upper()


class AffiliateCreate(AffiliateBase):
    periodos_laborales: Optional[List[PeriodoLaboralCreate]] = []
    remuneraciones: Optional[List[RemuneracionCreate]] = []


class AffiliateUpdate(BaseModel):
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    estado_civil: Optional[str] = None
    domicilio: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    estado: Optional[str] = None
    banco: Optional[str] = None
    tipo_cuenta: Optional[str] = None
    numero_cuenta: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    observaciones: Optional[str] = None


class AffiliateResponse(AffiliateBase):
    id: int
    estado: str
    numero_beneficio: Optional[str] = None
    fecha_alta: Optional[date] = None
    anios_aportes_pre_sijp: float
    anios_aportes_post_sijp: float
    promedio_remuneraciones: float
    pbu_calculada: float
    pc_calculada: float
    pap_calculada: float
    haber_inicial: float
    haber_actual: float
    created_at: Optional[datetime] = None
    periodos_laborales: List[PeriodoLaboralResponse] = []
    remuneraciones: List[RemuneracionResponse] = []

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

    class Config:
        from_attributes = True
