from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RIPTEBase(BaseModel):
    periodo: str
    valor: float
    variacion_mensual: Optional[float] = None
    variacion_trimestral: Optional[float] = None
    variacion_anual: Optional[float] = None
    fuente: str = "MTEySS"
    verificado: bool = True


class RIPTECreate(RIPTEBase):
    pass


class RIPTEUpdate(BaseModel):
    valor: Optional[float] = None
    variacion_mensual: Optional[float] = None
    variacion_trimestral: Optional[float] = None
    variacion_anual: Optional[float] = None
    verificado: Optional[bool] = None


class RIPTEResponse(RIPTEBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
