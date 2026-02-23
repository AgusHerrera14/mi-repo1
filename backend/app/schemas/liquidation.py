from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
import re


class ItemLiquidacionSchema(BaseModel):
    concepto: str
    codigo_concepto: Optional[str] = None
    tipo: str  # "haber" o "descuento"
    importe: float
    porcentaje: Optional[float] = None
    base_calculo: Optional[float] = None
    observacion: Optional[str] = None


class LiquidacionCreate(BaseModel):
    afiliado_id: int
    tipo: str = "mensual"
    periodo: str
    fecha_pago: Optional[date] = None
    observaciones: Optional[str] = None

    @field_validator("periodo")
    @classmethod
    def validar_periodo(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError("El período debe tener formato YYYY-MM")
        return v


class LiquidacionUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_pago: Optional[date] = None
    observaciones: Optional[str] = None


class LiquidacionResponse(BaseModel):
    id: int
    afiliado_id: int
    numero_liquidacion: Optional[str] = None
    tipo: str
    estado: str
    periodo: str
    fecha_pago: Optional[date] = None
    pbu: float
    pc: float
    pap: float
    haber_bruto: float
    haber_minimo_garantizado: float
    coeficiente_movilidad: float
    haber_con_movilidad: float
    descuento_obra_social: float
    descuento_otro: float
    total_descuentos: float
    meses_retroactivo: int
    importe_retroactivo: float
    haber_neto: float
    banco_pago: Optional[str] = None
    cbu_pago: Optional[str] = None
    observaciones: Optional[str] = None
    created_at: Optional[datetime] = None
    items: List[ItemLiquidacionSchema] = []

    class Config:
        from_attributes = True


class LiquidacionSummary(BaseModel):
    id: int
    afiliado_id: int
    numero_liquidacion: Optional[str] = None
    periodo: str
    tipo: str
    estado: str
    haber_neto: float

    class Config:
        from_attributes = True


class CalculoRequest(BaseModel):
    afiliado_id: int
    periodo: str
    aplicar_movilidad: bool = True
    periodo_movilidad_desde: Optional[str] = None


class CalculoResponse(BaseModel):
    afiliado_id: int
    periodo: str
    pbu: float
    pc: float
    pap: float
    haber_bruto: float
    haber_minimo_garantizado: float
    coeficiente_movilidad: float
    haber_con_movilidad: float
    descuento_obra_social: float
    haber_neto: float
    detalle_calculo: dict
    cumple_requisitos: bool
    observaciones: List[str] = []
