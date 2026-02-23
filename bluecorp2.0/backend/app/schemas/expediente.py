from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class MovimientoCreate(BaseModel):
    tipo: str
    descripcion: str
    estado_nuevo: Optional[str] = None


class MovimientoResponse(BaseModel):
    id: int
    expediente_id: int
    fecha: Optional[datetime] = None
    tipo: str
    estado_anterior: Optional[str] = None
    estado_nuevo: Optional[str] = None
    descripcion: str
    usuario_id: Optional[int] = None
    class Config:
        from_attributes = True


class ExpedienteCreate(BaseModel):
    afiliado_id: int
    tipo_tramite: str
    fecha_inicio: date
    solicitante_nombre: Optional[str] = None
    solicitante_cuil: Optional[str] = None
    es_apoderado: bool = False
    doc_dni: bool = False
    doc_partida_nacimiento: bool = False
    doc_certificados_aportes: bool = False
    doc_declaracion_jurada: bool = False
    doc_certificado_laboral: bool = False
    doc_partida_matrimonio: bool = False
    doc_certificado_medico: bool = False
    doc_otros: Optional[str] = None
    observaciones: Optional[str] = None
    notas_internas: Optional[str] = None


class ExpedienteUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_resolucion: Optional[date] = None
    numero_resolucion: Optional[str] = None
    doc_dni: Optional[bool] = None
    doc_partida_nacimiento: Optional[bool] = None
    doc_certificados_aportes: Optional[bool] = None
    doc_declaracion_jurada: Optional[bool] = None
    doc_certificado_laboral: Optional[bool] = None
    doc_partida_matrimonio: Optional[bool] = None
    doc_certificado_medico: Optional[bool] = None
    doc_otros: Optional[str] = None
    observaciones: Optional[str] = None
    notas_internas: Optional[str] = None
    asignado_a: Optional[int] = None


class ExpedienteResponse(ExpedienteCreate):
    id: int
    numero_expediente: str
    estado: str
    fecha_resolucion: Optional[date] = None
    numero_resolucion: Optional[str] = None
    asignado_a: Optional[int] = None
    created_at: Optional[datetime] = None
    movimientos: List[MovimientoResponse] = []
    class Config:
        from_attributes = True


class ExpedienteSummary(BaseModel):
    id: int
    afiliado_id: int
    numero_expediente: str
    tipo_tramite: str
    estado: str
    fecha_inicio: date
    fecha_resolucion: Optional[date] = None
    class Config:
        from_attributes = True
