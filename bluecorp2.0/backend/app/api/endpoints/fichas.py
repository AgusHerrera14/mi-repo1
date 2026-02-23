"""API endpoints para Fichas - Blue Corp."""
from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.ficha import Ficha, Servicio, Remuneracion
from app.models.user import User

router = APIRouter(prefix="/fichas", tags=["fichas"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ServicioCreate(BaseModel):
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    tipo: str = "dependencia"
    regimen: str = "SIPA"
    empleador: Optional[str] = None
    cuit_empleador: Optional[str] = None
    porcentaje: float = 100.0
    nota: Optional[str] = None

class ServicioOut(ServicioCreate):
    id: int
    class Config: from_attributes = True

class RemuneracionCreate(BaseModel):
    periodo: str
    importe_nominal: float
    tipo: str = "dependencia"
    empleador: Optional[str] = None
    nota: Optional[str] = None

class RemuneracionOut(RemuneracionCreate):
    id: int
    importe_actualizado: Optional[float] = None
    factor_actualizacion: Optional[float] = None
    indice_actualizacion: Optional[str] = None
    class Config: from_attributes = True

class FichaCreate(BaseModel):
    apellido_nombre: str
    cuil: str
    dni: Optional[str] = None
    fecha_nacimiento: date
    sexo: str
    domicilio: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    tipo_beneficio: str = "jubilacion_ordinaria"
    fecha_cese: Optional[date] = None
    fecha_calculo: Optional[date] = None
    observaciones_generales: Optional[str] = None

class FichaOut(FichaCreate):
    id: UUID
    numero: Optional[str] = None
    estado: str
    servicios: List[ServicioOut] = []
    remuneraciones: List[RemuneracionOut] = []
    created_at: date
    class Config: from_attributes = True

class FichaListOut(BaseModel):
    id: UUID
    numero: Optional[str] = None
    apellido_nombre: str
    cuil: str
    tipo_beneficio: str
    estado: str
    fecha_calculo: Optional[date] = None
    created_at: date
    class Config: from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[FichaListOut])
def list_fichas(
    skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ficha)
    if search:
        q = q.filter(
            (Ficha.apellido_nombre.ilike(f"%{search}%")) |
            (Ficha.cuil.ilike(f"%{search}%")) |
            (Ficha.numero.ilike(f"%{search}%"))
        )
    return q.order_by(Ficha.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=FichaOut, status_code=status.HTTP_201_CREATED)
def create_ficha(
    data: FichaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import uuid as uuid_mod
    ficha = Ficha(**data.model_dump(), user_id=current_user.id)
    # Generar número correlativo
    count = db.query(Ficha).count()
    ficha.numero = f"{count + 1:04d}/{date.today().year}"
    db.add(ficha)
    db.commit()
    db.refresh(ficha)
    return ficha


@router.get("/{ficha_id}", response_model=FichaOut)
def get_ficha(
    ficha_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ficha = db.query(Ficha).filter(Ficha.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    return ficha


@router.put("/{ficha_id}", response_model=FichaOut)
def update_ficha(
    ficha_id: UUID,
    data: FichaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ficha = db.query(Ficha).filter(Ficha.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    for k, v in data.model_dump().items():
        setattr(ficha, k, v)
    db.commit()
    db.refresh(ficha)
    return ficha


@router.delete("/{ficha_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ficha(
    ficha_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ficha = db.query(Ficha).filter(Ficha.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    db.delete(ficha)
    db.commit()


# ── Servicios ─────────────────────────────────────────────────────────────────

@router.post("/{ficha_id}/servicios", response_model=ServicioOut)
def add_servicio(
    ficha_id: UUID,
    data: ServicioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ficha = db.query(Ficha).filter(Ficha.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    s = Servicio(**data.model_dump(), ficha_id=ficha_id)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{ficha_id}/servicios/{servicio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_servicio(
    ficha_id: UUID,
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = db.query(Servicio).filter(Servicio.id == servicio_id, Servicio.ficha_id == ficha_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db.delete(s)
    db.commit()


# ── Remuneraciones ────────────────────────────────────────────────────────────

@router.post("/{ficha_id}/remuneraciones", response_model=RemuneracionOut)
def add_remuneracion(
    ficha_id: UUID,
    data: RemuneracionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ficha = db.query(Ficha).filter(Ficha.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    r = Remuneracion(**data.model_dump(), ficha_id=ficha_id)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/{ficha_id}/remuneraciones/{rem_id}", response_model=RemuneracionOut)
def update_remuneracion(
    ficha_id: UUID,
    rem_id: int,
    data: RemuneracionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Remuneracion).filter(Remuneracion.id == rem_id, Remuneracion.ficha_id == ficha_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Remuneración no encontrada")
    for k, v in data.model_dump().items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{ficha_id}/remuneraciones/{rem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_remuneracion(
    ficha_id: UUID,
    rem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Remuneracion).filter(Remuneracion.id == rem_id, Remuneracion.ficha_id == ficha_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Remuneración no encontrada")
    db.delete(r)
    db.commit()
