from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.affiliate import Affiliate
from app.models.liquidation import Liquidacion
from app.models.novedad import Novedad
from app.models.expediente import Expediente
from app.core.config import settings

router = APIRouter(prefix="/reports", tags=["Reportes"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_af = db.query(Affiliate).count()
    activos = db.query(Affiliate).filter(Affiliate.estado == "activo").count()
    pasivos = db.query(Affiliate).filter(Affiliate.estado == "pasivo").count()
    solicitantes = db.query(Affiliate).filter(Affiliate.estado == "solicitante").count()

    haber_prom = db.query(func.avg(Affiliate.haber_actual)).filter(
        Affiliate.estado == "activo").scalar() or 0
    haber_total = db.query(func.sum(Affiliate.haber_actual)).filter(
        Affiliate.estado == "activo").scalar() or 0

    total_liq = db.query(Liquidacion).filter(Liquidacion.estado != "anulada").count()
    autorizadas = db.query(Liquidacion).filter(Liquidacion.estado == "autorizada").count()
    pagadas = db.query(Liquidacion).filter(Liquidacion.estado == "pagada").count()
    masa = db.query(func.sum(Liquidacion.haber_neto)).filter(
        Liquidacion.estado == "pagada").scalar() or 0

    novedades_pendientes = db.query(Novedad).filter(Novedad.estado == "pendiente").count()
    expedientes_activos = db.query(Expediente).filter(
        Expediente.estado.in_(["iniciado", "en_tramite"])).count()

    por_tipo = db.query(
        Affiliate.tipo_prestacion, func.count(Affiliate.id).label("cantidad")
    ).group_by(Affiliate.tipo_prestacion).all()

    por_provincia = db.query(
        Affiliate.provincia, func.count(Affiliate.id).label("cantidad")
    ).group_by(Affiliate.provincia).order_by(func.count(Affiliate.id).desc()).limit(10).all()

    por_zona = db.query(
        Affiliate.zona, func.count(Affiliate.id).label("cantidad")
    ).group_by(Affiliate.zona).all()

    return {
        "afiliados": {
            "total": total_af, "activos": activos, "pasivos": pasivos,
            "solicitantes": solicitantes,
            "haber_promedio": round(haber_prom, 2),
            "haber_total_mensual": round(haber_total, 2),
        },
        "liquidaciones": {
            "total": total_liq, "autorizadas": autorizadas, "pagadas": pagadas,
            "masa_pagada": round(masa, 2),
        },
        "alertas": {
            "novedades_pendientes": novedades_pendientes,
            "expedientes_activos": expedientes_activos,
        },
        "distribucion_por_tipo": [{"tipo": t, "cantidad": c} for t, c in por_tipo],
        "distribucion_por_provincia": [{"provincia": p or "Sin especificar", "cantidad": c} for p, c in por_provincia],
        "distribucion_por_zona": [{"zona": z or "normal", "cantidad": c} for z, c in por_zona],
    }


@router.get("/afiliados/por-tipo")
def por_tipo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(
        Affiliate.tipo_prestacion,
        func.count(Affiliate.id).label("cantidad"),
        func.avg(Affiliate.haber_actual).label("haber_promedio"),
        func.sum(Affiliate.haber_actual).label("haber_total"),
    ).group_by(Affiliate.tipo_prestacion).all()
    return [{"tipo": x.tipo_prestacion, "cantidad": x.cantidad,
             "haber_promedio": round(x.haber_promedio or 0, 2),
             "haber_total": round(x.haber_total or 0, 2)} for x in r]


@router.get("/liquidaciones/por-periodo")
def por_periodo(
    anio: int = 2025,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(
        Liquidacion.periodo,
        func.count(Liquidacion.id).label("cantidad"),
        func.sum(Liquidacion.haber_neto).label("total_neto"),
        func.avg(Liquidacion.haber_neto).label("promedio_neto"),
    ).filter(
        Liquidacion.periodo.startswith(str(anio)),
        Liquidacion.estado != "anulada",
    ).group_by(Liquidacion.periodo).order_by(Liquidacion.periodo).all()
    return [{"periodo": x.periodo, "cantidad": x.cantidad,
             "total_neto": round(x.total_neto or 0, 2),
             "promedio_neto": round(x.promedio_neto or 0, 2)} for x in r]


@router.get("/haberes/rango")
def rango_haberes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    afiliados = db.query(Affiliate.haber_actual).filter(
        Affiliate.estado == "activo", Affiliate.haber_actual > 0).all()
    hm = settings.HABER_MINIMO_VIGENTE
    rangos = {"hasta_minimo": 0, "1x_a_2x": 0, "2x_a_4x": 0, "mas_4x": 0}
    for (h,) in afiliados:
        if h <= hm: rangos["hasta_minimo"] += 1
        elif h <= hm * 2: rangos["1x_a_2x"] += 1
        elif h <= hm * 4: rangos["2x_a_4x"] += 1
        else: rangos["mas_4x"] += 1
    return {"haber_minimo": hm, "rangos": rangos, "total": len(afiliados)}


@router.get("/padron")
def exportar_padron(
    estado: str = "activo",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna el padrón completo de beneficiarios en formato JSON."""
    afiliados = db.query(Affiliate).filter(Affiliate.estado == estado).all()
    return [
        {
            "numero_beneficio": a.numero_beneficio,
            "cuil": a.cuil,
            "apellido": a.apellido,
            "nombre": a.nombre,
            "tipo_prestacion": a.tipo_prestacion,
            "provincia": a.provincia,
            "haber_actual": a.haber_actual,
            "banco": a.banco,
            "cbu": a.cbu,
            "forma_pago": a.forma_pago,
        }
        for a in afiliados
    ]
