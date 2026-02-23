from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import random, string

from app.core.database import get_db
from app.api.deps import get_current_user, require_operador
from app.models.user import User
from app.models.affiliate import Affiliate, AfiliadoPeriodoLaboral, AfiliadoRemuneracion
from app.models.descuento import DescuentoVoluntario
from app.schemas.affiliate import (
    AffiliateCreate, AffiliateUpdate, AffiliateResponse, AffiliateSummary,
    PeriodoLaboralCreate, PeriodoLaboralResponse,
    RemuneracionCreate, RemuneracionResponse,
    DescuentoVoluntarioCreate, DescuentoVoluntarioResponse,
)
from app.engines.pension_engine import MotorCalculoPension, PeriodoLaboral, Remuneracion
from app.core.config import settings

router = APIRouter(prefix="/affiliates", tags=["Afiliados"])

COMPLEMENTO_ZONA = {
    "normal": 0.0,
    "desfavorable": 0.10,       # +10%
    "muy_desfavorable": 0.20,   # +20%
    "extrema": 0.30,             # +30%
}


def _generar_numero_beneficio(db: Session) -> str:
    while True:
        num = "BC-" + "".join(random.choices(string.digits, k=8))
        if not db.query(Affiliate).filter(Affiliate.numero_beneficio == num).first():
            return num


def _recalcular_haber(affiliate: Affiliate, db: Session):
    motor = MotorCalculoPension()
    periodos = [
        PeriodoLaboral(fecha_inicio=p.fecha_inicio, fecha_fin=p.fecha_fin, tipo=p.tipo_relacion)
        for p in affiliate.periodos_laborales
    ]
    rems = [
        Remuneracion(periodo=r.periodo, importe=r.remuneracion_imponible)
        for r in affiliate.remuneraciones
    ]
    res = motor.calcular_jubilacion_ordinaria(
        fecha_nacimiento=affiliate.fecha_nacimiento,
        sexo=affiliate.sexo,
        periodos_laborales=periodos,
        remuneraciones=rems,
    )
    affiliate.anios_aportes_pre_sijp = res.anios_reconocidos_pre_sijp
    affiliate.anios_aportes_post_sijp = res.anios_reconocidos_post_sijp
    affiliate.promedio_remuneraciones = res.pbci
    affiliate.pbu_calculada = res.pbu
    affiliate.pc_calculada = res.pc
    affiliate.pap_calculada = res.pap

    # Complemento zona geográfica
    zona = affiliate.zona or "normal"
    pct_zona = COMPLEMENTO_ZONA.get(zona, 0.0)
    affiliate.complemento_zona = res.haber_final * pct_zona

    affiliate.haber_inicial = res.haber_final + affiliate.complemento_zona
    if affiliate.haber_actual == 0.0:
        affiliate.haber_actual = affiliate.haber_inicial


@router.get("/stats/resumen")
def resumen_estadistico(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    total = db.query(Affiliate).count()
    activos = db.query(Affiliate).filter(Affiliate.estado == "activo").count()
    solicitantes = db.query(Affiliate).filter(Affiliate.estado == "solicitante").count()
    pasivos = db.query(Affiliate).filter(Affiliate.estado == "pasivo").count()
    haber_prom = db.query(func.avg(Affiliate.haber_actual)).filter(
        Affiliate.estado == "activo"
    ).scalar() or 0
    return {
        "total_afiliados": total,
        "activos": activos,
        "solicitantes": solicitantes,
        "pasivos": pasivos,
        "haber_promedio": round(haber_prom, 2),
    }


@router.get("/", response_model=List[AffiliateSummary])
def listar_afiliados(
    skip: int = 0, limit: int = 200,
    estado: Optional[str] = None,
    tipo_prestacion: Optional[str] = None,
    provincia: Optional[str] = None,
    busqueda: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Affiliate)
    if estado:
        q = q.filter(Affiliate.estado == estado)
    if tipo_prestacion:
        q = q.filter(Affiliate.tipo_prestacion == tipo_prestacion)
    if provincia:
        q = q.filter(Affiliate.provincia == provincia)
    if busqueda:
        q = q.filter(
            (Affiliate.apellido.ilike(f"%{busqueda}%")) |
            (Affiliate.nombre.ilike(f"%{busqueda}%")) |
            (Affiliate.cuil.ilike(f"%{busqueda}%")) |
            (Affiliate.dni.ilike(f"%{busqueda}%")) |
            (Affiliate.numero_beneficio.ilike(f"%{busqueda}%"))
        )
    return q.order_by(Affiliate.apellido, Affiliate.nombre).offset(skip).limit(limit).all()


@router.post("/", response_model=AffiliateResponse, status_code=201)
def crear_afiliado(
    data: AffiliateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    if db.query(Affiliate).filter(Affiliate.cuil == data.cuil).first():
        raise HTTPException(400, "Ya existe un afiliado con ese CUIL")
    if db.query(Affiliate).filter(Affiliate.dni == data.dni).first():
        raise HTTPException(400, "Ya existe un afiliado con ese DNI")

    affiliate = Affiliate(
        **data.model_dump(exclude={"periodos_laborales", "remuneraciones"}),
        numero_beneficio=_generar_numero_beneficio(db),
        created_by=current_user.id,
    )
    db.add(affiliate)
    db.flush()

    for pl in data.periodos_laborales:
        db.add(AfiliadoPeriodoLaboral(afiliado_id=affiliate.id, **pl.model_dump()))

    for rem in data.remuneraciones:
        rd = rem.model_dump()
        if rd.get("aporte_personal") is None:
            rd["aporte_personal"] = rd["remuneracion_imponible"] * settings.TASA_APORTE_PERSONAL
        if rd.get("contribucion_patronal") is None:
            rd["contribucion_patronal"] = rd["remuneracion_imponible"] * settings.TASA_CONTRIBUCION_PATRONAL
        db.add(AfiliadoRemuneracion(afiliado_id=affiliate.id, **rd))

    db.flush()
    db.refresh(affiliate)
    _recalcular_haber(affiliate, db)
    db.commit()
    db.refresh(affiliate)
    return affiliate


@router.get("/{affiliate_id}", response_model=AffiliateResponse)
def obtener_afiliado(
    affiliate_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    a = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not a:
        raise HTTPException(404, "Afiliado no encontrado")
    return a


@router.put("/{affiliate_id}", response_model=AffiliateResponse)
def actualizar_afiliado(
    affiliate_id: int, data: AffiliateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    a = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not a:
        raise HTTPException(404, "Afiliado no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{affiliate_id}", status_code=204)
def eliminar_afiliado(
    affiliate_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    a = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not a:
        raise HTTPException(404, "Afiliado no encontrado")
    db.delete(a)
    db.commit()


@router.post("/{affiliate_id}/periodos", response_model=PeriodoLaboralResponse, status_code=201)
def agregar_periodo(
    affiliate_id: int, data: PeriodoLaboralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    a = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not a:
        raise HTTPException(404, "Afiliado no encontrado")
    p = AfiliadoPeriodoLaboral(afiliado_id=affiliate_id, **data.model_dump())
    db.add(p)
    db.flush()
    db.refresh(a)
    _recalcular_haber(a, db)
    db.commit()
    db.refresh(p)
    return p


@router.post("/{affiliate_id}/remuneraciones", response_model=RemuneracionResponse, status_code=201)
def agregar_remuneracion(
    affiliate_id: int, data: RemuneracionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    a = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not a:
        raise HTTPException(404, "Afiliado no encontrado")
    rd = data.model_dump()
    if rd.get("aporte_personal") is None:
        rd["aporte_personal"] = rd["remuneracion_imponible"] * settings.TASA_APORTE_PERSONAL
    if rd.get("contribucion_patronal") is None:
        rd["contribucion_patronal"] = rd["remuneracion_imponible"] * settings.TASA_CONTRIBUCION_PATRONAL
    r = AfiliadoRemuneracion(afiliado_id=affiliate_id, **rd)
    db.add(r)
    db.flush()
    db.refresh(a)
    _recalcular_haber(a, db)
    db.commit()
    db.refresh(r)
    return r


@router.post("/{affiliate_id}/descuentos", response_model=DescuentoVoluntarioResponse, status_code=201)
def agregar_descuento(
    affiliate_id: int, data: DescuentoVoluntarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    a = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not a:
        raise HTTPException(404, "Afiliado no encontrado")
    d = DescuentoVoluntario(
        afiliado_id=affiliate_id,
        created_by=current_user.id,
        **data.model_dump()
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{affiliate_id}/descuentos/{desc_id}", status_code=204)
def eliminar_descuento(
    affiliate_id: int, desc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    d = db.query(DescuentoVoluntario).filter(
        DescuentoVoluntario.id == desc_id,
        DescuentoVoluntario.afiliado_id == affiliate_id,
    ).first()
    if not d:
        raise HTTPException(404, "Descuento no encontrado")
    db.delete(d)
    db.commit()


@router.post("/{affiliate_id}/recalcular", response_model=AffiliateResponse)
def recalcular(
    affiliate_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    a = db.query(Affiliate).filter(Affiliate.id == affiliate_id).first()
    if not a:
        raise HTTPException(404, "Afiliado no encontrado")
    _recalcular_haber(a, db)
    db.commit()
    db.refresh(a)
    return a
