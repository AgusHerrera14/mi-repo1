from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.affiliate import Affiliate
from app.models.liquidation import Liquidacion

router = APIRouter(prefix="/reports", tags=["Reportes"])


@router.get("/dashboard")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_afiliados = db.query(Affiliate).count()
    activos = db.query(Affiliate).filter(Affiliate.estado == "activo").count()
    pasivos = db.query(Affiliate).filter(Affiliate.estado == "pasivo").count()
    solicitantes = db.query(Affiliate).filter(Affiliate.estado == "solicitante").count()

    haber_promedio = db.query(func.avg(Affiliate.haber_actual)).filter(
        Affiliate.estado == "activo"
    ).scalar() or 0
    haber_total = db.query(func.sum(Affiliate.haber_actual)).filter(
        Affiliate.estado == "activo"
    ).scalar() or 0

    total_liq = db.query(Liquidacion).filter(Liquidacion.estado != "anulada").count()
    autorizadas = db.query(Liquidacion).filter(Liquidacion.estado == "autorizada").count()
    pagadas = db.query(Liquidacion).filter(Liquidacion.estado == "pagada").count()

    masa_pagada = db.query(func.sum(Liquidacion.haber_neto)).filter(
        Liquidacion.estado == "pagada"
    ).scalar() or 0

    # Distribución por tipo de prestación
    por_tipo = db.query(
        Affiliate.tipo_prestacion,
        func.count(Affiliate.id).label("cantidad")
    ).group_by(Affiliate.tipo_prestacion).all()

    # Distribución por provincia
    por_provincia = db.query(
        Affiliate.provincia,
        func.count(Affiliate.id).label("cantidad")
    ).group_by(Affiliate.provincia).order_by(func.count(Affiliate.id).desc()).limit(10).all()

    return {
        "afiliados": {
            "total": total_afiliados,
            "activos": activos,
            "pasivos": pasivos,
            "solicitantes": solicitantes,
            "haber_promedio": round(haber_promedio, 2),
            "haber_total_mensual": round(haber_total, 2),
        },
        "liquidaciones": {
            "total": total_liq,
            "autorizadas": autorizadas,
            "pagadas": pagadas,
            "masa_pagada": round(masa_pagada, 2),
        },
        "distribucion_por_tipo": [
            {"tipo": t.tipo_prestacion, "cantidad": t.cantidad}
            for t in por_tipo
        ],
        "distribucion_por_provincia": [
            {"provincia": p.provincia or "No especificada", "cantidad": p.cantidad}
            for p in por_provincia
        ],
    }


@router.get("/afiliados/por-tipo")
def afiliados_por_tipo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.query(
        Affiliate.tipo_prestacion,
        func.count(Affiliate.id).label("cantidad"),
        func.avg(Affiliate.haber_actual).label("haber_promedio"),
        func.sum(Affiliate.haber_actual).label("haber_total"),
    ).group_by(Affiliate.tipo_prestacion).all()

    return [
        {
            "tipo": r.tipo_prestacion,
            "cantidad": r.cantidad,
            "haber_promedio": round(r.haber_promedio or 0, 2),
            "haber_total": round(r.haber_total or 0, 2),
        }
        for r in result
    ]


@router.get("/liquidaciones/por-periodo")
def liquidaciones_por_periodo(
    anio: int = 2025,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.query(
        Liquidacion.periodo,
        func.count(Liquidacion.id).label("cantidad"),
        func.sum(Liquidacion.haber_neto).label("total_neto"),
        func.avg(Liquidacion.haber_neto).label("promedio_neto"),
    ).filter(
        Liquidacion.periodo.startswith(str(anio)),
        Liquidacion.estado != "anulada",
    ).group_by(Liquidacion.periodo).order_by(Liquidacion.periodo).all()

    return [
        {
            "periodo": r.periodo,
            "cantidad": r.cantidad,
            "total_neto": round(r.total_neto or 0, 2),
            "promedio_neto": round(r.promedio_neto or 0, 2),
        }
        for r in result
    ]


@router.get("/haberes/rango")
def haberes_por_rango(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Distribución de afiliados activos por rango de haber."""
    from app.core.config import settings

    afiliados = db.query(Affiliate.haber_actual).filter(
        Affiliate.estado == "activo",
        Affiliate.haber_actual > 0,
    ).all()

    rangos = {
        "hasta_minimo": 0,
        "1x_a_2x_minimo": 0,
        "2x_a_4x_minimo": 0,
        "mas_4x_minimo": 0,
    }
    hm = settings.HABER_MINIMO_VIGENTE

    for (haber,) in afiliados:
        if haber <= hm:
            rangos["hasta_minimo"] += 1
        elif haber <= hm * 2:
            rangos["1x_a_2x_minimo"] += 1
        elif haber <= hm * 4:
            rangos["2x_a_4x_minimo"] += 1
        else:
            rangos["mas_4x_minimo"] += 1

    return {
        "haber_minimo_referencia": hm,
        "rangos": rangos,
        "total_activos": len(afiliados),
    }
