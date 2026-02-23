from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import random
import string

from app.core.database import get_db
from app.api.deps import get_current_user, require_operador
from app.models.user import User
from app.models.affiliate import Affiliate, AfiliadoPeriodoLaboral, AfiliadoRemuneracion
from app.schemas.affiliate import (
    AffiliateCreate, AffiliateUpdate, AffiliateResponse, AffiliateSummary,
    PeriodoLaboralCreate, PeriodoLaboralResponse,
    RemuneracionCreate, RemuneracionResponse,
)
from app.engines.pension_engine import (
    MotorCalculoPension, PeriodoLaboral, Remuneracion
)

router = APIRouter(prefix="/affiliates", tags=["Afiliados"])


def _generar_numero_beneficio(db: Session) -> str:
    while True:
        num = "BC-" + "".join(random.choices(string.digits, k=8))
        if not db.query(Affiliate).filter(Affiliate.numero_beneficio == num).first():
            return num


def _recalcular_haber(affiliate: Affiliate, db: Session):
    """Recalcula el haber previsional con los datos actuales del afiliado."""
    motor = MotorCalculoPension()
    periodos = [
        PeriodoLaboral(
            fecha_inicio=p.fecha_inicio,
            fecha_fin=p.fecha_fin,
            tipo=p.tipo_relacion,
        )
        for p in affiliate.periodos_laborales
    ]
    remuneraciones = [
        Remuneracion(periodo=r.periodo, importe=r.remuneracion_imponible)
        for r in affiliate.remuneraciones
    ]
    resultado = motor.calcular_jubilacion_ordinaria(
        fecha_nacimiento=affiliate.fecha_nacimiento,
        sexo=affiliate.sexo,
        periodos_laborales=periodos,
        remuneraciones=remuneraciones,
    )
    affiliate.anios_aportes_pre_sijp = resultado.anios_reconocidos_pre_sijp
    affiliate.anios_aportes_post_sijp = resultado.anios_reconocidos_post_sijp
    affiliate.promedio_remuneraciones = resultado.pbci
    affiliate.pbu_calculada = resultado.pbu
    affiliate.pc_calculada = resultado.pc
    affiliate.pap_calculada = resultado.pap
    affiliate.haber_inicial = resultado.haber_final
    if affiliate.haber_actual == 0.0:
        affiliate.haber_actual = resultado.haber_final


@router.get("/", response_model=List[AffiliateSummary])
def listar_afiliados(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    tipo_prestacion: Optional[str] = None,
    busqueda: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Affiliate)
    if estado:
        query = query.filter(Affiliate.estado == estado)
    if tipo_prestacion:
        query = query.filter(Affiliate.tipo_prestacion == tipo_prestacion)
    if busqueda:
        query = query.filter(
            (Affiliate.apellido.ilike(f"%{busqueda}%")) |
            (Affiliate.nombre.ilike(f"%{busqueda}%")) |
            (Affiliate.cuil.ilike(f"%{busqueda}%")) |
            (Affiliate.dni.ilike(f"%{busqueda}%")) |
            (Affiliate.numero_beneficio.ilike(f"%{busqueda}%"))
        )
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=AffiliateResponse, status_code=201)
def crear_afiliado(
    data: AffiliateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    if db.query(Affiliate).filter(Affiliate.cuil == data.cuil).first():
        raise HTTPException(status_code=400, detail="Ya existe un afiliado con ese CUIL")
    if db.query(Affiliate).filter(Affiliate.dni == data.dni).first():
        raise HTTPException(status_code=400, detail="Ya existe un afiliado con ese DNI")

    affiliate = Affiliate(
        **data.model_dump(exclude={"periodos_laborales", "remuneraciones"}),
        numero_beneficio=_generar_numero_beneficio(db),
        created_by=current_user.id,
    )
    db.add(affiliate)
    db.flush()

    for pl in data.periodos_laborales:
        periodo = AfiliadoPeriodoLaboral(afiliado_id=affiliate.id, **pl.model_dump())
        db.add(periodo)

    for rem in data.remuneraciones:
        rem_data = rem.model_dump()
        if rem_data.get("aporte_personal") is None:
            rem_data["aporte_personal"] = rem_data["remuneracion_imponible"] * 0.11
        if rem_data.get("contribucion_patronal") is None:
            rem_data["contribucion_patronal"] = rem_data["remuneracion_imponible"] * 0.16
        remuneracion = AfiliadoRemuneracion(afiliado_id=affiliate.id, **rem_data)
        db.add(remuneracion)

    db.flush()
    db.refresh(affiliate)
    _recalcular_haber(affiliate, db)
    db.commit()
    db.refresh(affiliate)
    return affiliate


@router.get("/{affiliate_id}", response_model=AffiliateResponse)
def obtener_afiliado(
    affiliate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    affiliate = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")
    return affiliate


@router.put("/{affiliate_id}", response_model=AffiliateResponse)
def actualizar_afiliado(
    affiliate_id: int,
    data: AffiliateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    affiliate = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(affiliate, field, value)

    db.commit()
    db.refresh(affiliate)
    return affiliate


@router.delete("/{affiliate_id}", status_code=204)
def eliminar_afiliado(
    affiliate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    affiliate = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")
    db.delete(affiliate)
    db.commit()


@router.post("/{affiliate_id}/periodos", response_model=PeriodoLaboralResponse, status_code=201)
def agregar_periodo(
    affiliate_id: int,
    data: PeriodoLaboralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    affiliate = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")

    periodo = AfiliadoPeriodoLaboral(afiliado_id=affiliate_id, **data.model_dump())
    db.add(periodo)
    db.flush()
    db.refresh(affiliate)
    _recalcular_haber(affiliate, db)
    db.commit()
    db.refresh(periodo)
    return periodo


@router.post("/{affiliate_id}/remuneraciones", response_model=RemuneracionResponse, status_code=201)
def agregar_remuneracion(
    affiliate_id: int,
    data: RemuneracionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    affiliate = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")

    rem_data = data.model_dump()
    if rem_data.get("aporte_personal") is None:
        rem_data["aporte_personal"] = rem_data["remuneracion_imponible"] * 0.11
    if rem_data.get("contribucion_patronal") is None:
        rem_data["contribucion_patronal"] = rem_data["remuneracion_imponible"] * 0.16

    rem = AfiliadoRemuneracion(afiliado_id=affiliate_id, **rem_data)
    db.add(rem)
    db.flush()
    db.refresh(affiliate)
    _recalcular_haber(affiliate, db)
    db.commit()
    db.refresh(rem)
    return rem


@router.post("/{affiliate_id}/recalcular", response_model=AffiliateResponse)
def recalcular(
    affiliate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    affiliate = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")
    _recalcular_haber(affiliate, db)
    db.commit()
    db.refresh(affiliate)
    return affiliate


@router.get("/stats/resumen")
def resumen_estadistico(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Affiliate).count()
    activos = db.query(Affiliate).filter(Affiliate.estado == "activo").count()
    solicitantes = db.query(Affiliate).filter(Affiliate.estado == "solicitante").count()
    pasivos = db.query(Affiliate).filter(Affiliate.estado == "pasivo").count()

    from sqlalchemy import func
    haber_promedio = db.query(func.avg(Affiliate.haber_actual)).filter(
        Affiliate.estado == "activo"
    ).scalar() or 0

    return {
        "total_afiliados": total,
        "activos": activos,
        "solicitantes": solicitantes,
        "pasivos": pasivos,
        "haber_promedio": round(haber_promedio, 2),
    }
