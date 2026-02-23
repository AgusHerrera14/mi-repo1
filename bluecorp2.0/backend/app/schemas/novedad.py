from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NovedadCreate(BaseModel):
    afiliado_id: int
    tipo: str
    descripcion: str
    periodo_desde: Optional[str] = None
    periodo_hasta: Optional[str] = None
    importe_impacto: float = 0.0
    impacta_haber: bool = False
    numero_resolucion: Optional[str] = None
    organismo_origen: Optional[str] = None
    observaciones: Optional[str] = None


class NovedadUpdate(BaseModel):
    estado: Optional[str] = None
    descripcion: Optional[str] = None
    importe_impacto: Optional[float] = None
    observaciones: Optional[str] = None


class NovedadResponse(NovedadCreate):
    id: int
    estado: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True
