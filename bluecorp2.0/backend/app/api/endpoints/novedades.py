from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user, require_operador
from app.models.user import User
from app.models.novedad import Novedad
from app.schemas.novedad import NovedadCreate, NovedadUpdate, NovedadResponse

router = APIRouter(prefix="/novedades", tags=["Novedades"])

TIPOS_NOVEDAD = [
    "suspension_laboral", "reincorporacion", "fallecimiento", "baja_voluntaria",
    "cambio_banco", "cambio_domicilio", "cambio_estado_civil", "incompatibilidad",
    "reintegro_aportes", "retroactivo_manual", "embargo_nuevo", "embargo_baja",
    "alta_descuento", "baja_descuento", "correccion_haber", "suplemento",
]


@router.get("/tipos")
def obtener_tipos():
    return {"tipos": TIPOS_NOVEDAD}


@router.get("/", response_model=List[NovedadResponse])
def listar_novedades(
    skip: int = 0, limit: int = 100,
    afiliado_id: Optional[int] = None,
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Novedad)
    if afiliado_id:
        q = q.filter(Novedad.afiliado_id == afiliado_id)
    if estado:
        q = q.filter(Novedad.estado == estado)
    if tipo:
        q = q.filter(Novedad.tipo == tipo)
    return q.order_by(Novedad.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=NovedadResponse, status_code=201)
def crear_novedad(
    data: NovedadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    novedad = Novedad(**data.model_dump(), created_by=current_user.id)
    db.add(novedad)
    db.commit()
    db.refresh(novedad)
    return novedad


@router.get("/{novedad_id}", response_model=NovedadResponse)
def obtener_novedad(
    novedad_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(Novedad).filter(Novedad.id == novedad_id).first()
    if not n:
        raise HTTPException(404, "Novedad no encontrada")
    return n


@router.put("/{novedad_id}", response_model=NovedadResponse)
def actualizar_novedad(
    novedad_id: int, data: NovedadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    n = db.query(Novedad).filter(Novedad.id == novedad_id).first()
    if not n:
        raise HTTPException(404, "Novedad no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(n, k, v)
    if data.estado == "procesada":
        n.procesado_by = current_user.id
        n.fecha_procesado = datetime.utcnow()
    db.commit()
    db.refresh(n)
    return n


@router.get("/stats/pendientes")
def pendientes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    total = db.query(Novedad).filter(Novedad.estado == "pendiente").count()
    por_tipo = db.query(
        Novedad.tipo, func.count(Novedad.id)
    ).filter(Novedad.estado == "pendiente").group_by(Novedad.tipo).all()
    return {"total_pendientes": total, "por_tipo": {t: c for t, c in por_tipo}}
