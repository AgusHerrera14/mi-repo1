from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import random, string

from app.core.database import get_db
from app.api.deps import get_current_user, require_operador
from app.models.user import User
from app.models.expediente import Expediente, MovimientoExpediente
from app.schemas.expediente import (
    ExpedienteCreate, ExpedienteUpdate, ExpedienteResponse,
    ExpedienteSummary, MovimientoCreate, MovimientoResponse
)

router = APIRouter(prefix="/expedientes", tags=["Expedientes"])


def _num_exp(db: Session) -> str:
    while True:
        n = "EXP-" + "".join(random.choices(string.digits, k=8))
        if not db.query(Expediente).filter(Expediente.numero_expediente == n).first():
            return n


@router.get("/", response_model=List[ExpedienteSummary])
def listar_expedientes(
    skip: int = 0, limit: int = 100,
    afiliado_id: Optional[int] = None,
    estado: Optional[str] = None,
    tipo_tramite: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Expediente)
    if afiliado_id:
        q = q.filter(Expediente.afiliado_id == afiliado_id)
    if estado:
        q = q.filter(Expediente.estado == estado)
    if tipo_tramite:
        q = q.filter(Expediente.tipo_tramite == tipo_tramite)
    return q.order_by(Expediente.fecha_inicio.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ExpedienteResponse, status_code=201)
def crear_expediente(
    data: ExpedienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    exp = Expediente(
        **data.model_dump(),
        numero_expediente=_num_exp(db),
        estado="iniciado",
        created_by=current_user.id,
        asignado_a=current_user.id,
    )
    db.add(exp)
    db.flush()

    # Primer movimiento automático
    mov = MovimientoExpediente(
        expediente_id=exp.id,
        tipo="estado_nuevo",
        estado_anterior=None,
        estado_nuevo="iniciado",
        descripcion=f"Expediente iniciado por {current_user.full_name}",
        usuario_id=current_user.id,
    )
    db.add(mov)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/{exp_id}", response_model=ExpedienteResponse)
def obtener_expediente(
    exp_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exp = db.query(Expediente).filter(Expediente.id == exp_id).first()
    if not exp:
        raise HTTPException(404, "Expediente no encontrado")
    return exp


@router.put("/{exp_id}", response_model=ExpedienteResponse)
def actualizar_expediente(
    exp_id: int, data: ExpedienteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    exp = db.query(Expediente).filter(Expediente.id == exp_id).first()
    if not exp:
        raise HTTPException(404, "Expediente no encontrado")

    estado_anterior = exp.estado
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(exp, k, v)

    if data.estado and data.estado != estado_anterior:
        mov = MovimientoExpediente(
            expediente_id=exp.id,
            tipo="estado_nuevo",
            estado_anterior=estado_anterior,
            estado_nuevo=data.estado,
            descripcion=f"Estado cambiado a '{data.estado}' por {current_user.full_name}",
            usuario_id=current_user.id,
        )
        db.add(mov)

    db.commit()
    db.refresh(exp)
    return exp


@router.post("/{exp_id}/movimientos", response_model=MovimientoResponse, status_code=201)
def agregar_movimiento(
    exp_id: int, data: MovimientoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    exp = db.query(Expediente).filter(Expediente.id == exp_id).first()
    if not exp:
        raise HTTPException(404, "Expediente no encontrado")

    estado_anterior = exp.estado
    if data.estado_nuevo and data.estado_nuevo != exp.estado:
        exp.estado = data.estado_nuevo

    mov = MovimientoExpediente(
        expediente_id=exp_id,
        tipo=data.tipo,
        estado_anterior=estado_anterior,
        estado_nuevo=data.estado_nuevo,
        descripcion=data.descripcion,
        usuario_id=current_user.id,
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


@router.get("/stats/resumen")
def resumen_expedientes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    total = db.query(Expediente).count()
    por_estado = db.query(
        Expediente.estado, func.count(Expediente.id)
    ).group_by(Expediente.estado).all()
    por_tipo = db.query(
        Expediente.tipo_tramite, func.count(Expediente.id)
    ).group_by(Expediente.tipo_tramite).all()
    return {
        "total": total,
        "por_estado": {e: c for e, c in por_estado},
        "por_tipo": {t: c for t, c in por_tipo},
    }
