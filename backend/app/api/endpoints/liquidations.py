from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import random
import string

from app.core.database import get_db
from app.api.deps import get_current_user, require_operador
from app.models.user import User
from app.models.affiliate import Affiliate, AfiliadoPeriodoLaboral
from app.models.liquidation import Liquidacion, ItemLiquidacion
from app.schemas.liquidation import (
    LiquidacionCreate, LiquidacionUpdate, LiquidacionResponse,
    LiquidacionSummary, CalculoRequest, CalculoResponse
)
from app.engines.pension_engine import MotorCalculoPension, PeriodoLaboral, Remuneracion
from app.engines.movilidad_engine import MotorMovilidad
from app.core.config import settings

router = APIRouter(prefix="/liquidations", tags=["Liquidaciones"])


def _generar_numero_liq(db: Session) -> str:
    while True:
        num = "LIQ-" + "".join(random.choices(string.digits, k=10))
        if not db.query(Liquidacion).filter(Liquidacion.numero_liquidacion == num).first():
            return num


def _calcular_liquidacion(afiliado: Affiliate, periodo: str, db: Session) -> dict:
    motor = MotorCalculoPension()
    motor_movilidad = MotorMovilidad()

    periodos_laborales = [
        PeriodoLaboral(
            fecha_inicio=p.fecha_inicio,
            fecha_fin=p.fecha_fin,
            tipo=p.tipo_relacion,
        )
        for p in afiliado.periodos_laborales
    ]
    remuneraciones = [
        Remuneracion(periodo=r.periodo, importe=r.remuneracion_imponible)
        for r in afiliado.remuneraciones
    ]

    resultado = motor.calcular_jubilacion_ordinaria(
        fecha_nacimiento=afiliado.fecha_nacimiento,
        sexo=afiliado.sexo,
        periodos_laborales=periodos_laborales,
        remuneraciones=remuneraciones,
    )

    # Aplicar movilidad desde el alta del beneficio
    coeficiente_mov = 1.0
    haber_con_movilidad = resultado.haber_final

    if afiliado.haber_inicial and afiliado.haber_inicial > 0:
        haber_con_movilidad = afiliado.haber_actual  # ya tiene movilidad aplicada acumulada
        coeficiente_mov = haber_con_movilidad / afiliado.haber_inicial if afiliado.haber_inicial else 1.0
    else:
        haber_con_movilidad = resultado.haber_final

    # Aplicar el último incremento de movilidad
    ultimo_periodo = motor_movilidad.obtener_coeficiente_ultimo()
    coef_ultimo = 1.0 + ultimo_periodo["pct"] / 100.0

    # Descuento PAMI (Ley 19.032, 3% del haber bruto)
    descuento_pami = haber_con_movilidad * 0.03

    # Haber neto
    haber_neto = haber_con_movilidad - descuento_pami

    return {
        "pbu": resultado.pbu,
        "pc": resultado.pc,
        "pap": resultado.pap,
        "haber_bruto": resultado.haber_bruto,
        "haber_minimo_garantizado": settings.HABER_MINIMO_VIGENTE,
        "coeficiente_movilidad": coeficiente_mov,
        "haber_con_movilidad": haber_con_movilidad,
        "descuento_obra_social": descuento_pami,
        "descuento_otro": 0.0,
        "total_descuentos": descuento_pami,
        "haber_neto": haber_neto,
        "items": [
            {"concepto": "PBU - Prestación Básica Universal", "codigo_concepto": "001", "tipo": "haber", "importe": resultado.pbu},
            {"concepto": "PC - Prestación Compensatoria", "codigo_concepto": "002", "tipo": "haber", "importe": resultado.pc},
            {"concepto": "PAP - Prestación Adicional por Permanencia", "codigo_concepto": "003", "tipo": "haber", "importe": resultado.pap},
            {"concepto": "Movilidad previsional", "codigo_concepto": "010", "tipo": "haber",
             "importe": haber_con_movilidad - resultado.haber_bruto,
             "porcentaje": (coeficiente_mov - 1) * 100,
             "base_calculo": resultado.haber_bruto},
            {"concepto": "Descuento PAMI (Ley 19.032)", "codigo_concepto": "901", "tipo": "descuento",
             "importe": descuento_pami, "porcentaje": 3.0, "base_calculo": haber_con_movilidad},
        ],
        "detalle_calculo": resultado.detalle_calculo,
        "cumple_requisitos": resultado.tiene_derecho,
        "observaciones": resultado.observaciones,
    }


@router.post("/calcular", response_model=CalculoResponse)
def calcular_previo(
    request: CalculoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    afiliado = db.query(Affiliate).filter(Affiliate.id == request.afiliado_id).first()
    if not afiliado:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")

    calculo = _calcular_liquidacion(afiliado, request.periodo, db)
    return CalculoResponse(
        afiliado_id=request.afiliado_id,
        periodo=request.periodo,
        **{k: calculo[k] for k in [
            "pbu", "pc", "pap", "haber_bruto", "haber_minimo_garantizado",
            "coeficiente_movilidad", "haber_con_movilidad",
            "descuento_obra_social", "haber_neto",
            "detalle_calculo", "cumple_requisitos", "observaciones"
        ]}
    )


@router.post("/", response_model=LiquidacionResponse, status_code=201)
def crear_liquidacion(
    data: LiquidacionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    afiliado = db.query(Affiliate).filter(Affiliate.id == data.afiliado_id).first()
    if not afiliado:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")

    # Verificar que no exista liquidación para el mismo período
    existente = db.query(Liquidacion).filter(
        Liquidacion.afiliado_id == data.afiliado_id,
        Liquidacion.periodo == data.periodo,
        Liquidacion.tipo == data.tipo,
        Liquidacion.estado != "anulada",
    ).first()
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe una liquidación {data.tipo} para el período {data.periodo}"
        )

    calculo = _calcular_liquidacion(afiliado, data.periodo, db)

    liquidacion = Liquidacion(
        afiliado_id=data.afiliado_id,
        numero_liquidacion=_generar_numero_liq(db),
        tipo=data.tipo,
        estado="calculada",
        periodo=data.periodo,
        fecha_pago=data.fecha_pago,
        pbu=calculo["pbu"],
        pc=calculo["pc"],
        pap=calculo["pap"],
        haber_bruto=calculo["haber_bruto"],
        haber_minimo_garantizado=calculo["haber_minimo_garantizado"],
        coeficiente_movilidad=calculo["coeficiente_movilidad"],
        haber_con_movilidad=calculo["haber_con_movilidad"],
        descuento_obra_social=calculo["descuento_obra_social"],
        descuento_otro=calculo["descuento_otro"],
        total_descuentos=calculo["total_descuentos"],
        haber_neto=calculo["haber_neto"],
        banco_pago=afiliado.banco,
        cbu_pago=afiliado.cbu,
        observaciones=data.observaciones,
        created_by=current_user.id,
    )
    db.add(liquidacion)
    db.flush()

    for item_data in calculo["items"]:
        item = ItemLiquidacion(liquidacion_id=liquidacion.id, **item_data)
        db.add(item)

    db.commit()
    db.refresh(liquidacion)
    return liquidacion


@router.get("/", response_model=List[LiquidacionSummary])
def listar_liquidaciones(
    skip: int = 0,
    limit: int = 100,
    afiliado_id: Optional[int] = None,
    periodo: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Liquidacion)
    if afiliado_id:
        query = query.filter(Liquidacion.afiliado_id == afiliado_id)
    if periodo:
        query = query.filter(Liquidacion.periodo == periodo)
    if estado:
        query = query.filter(Liquidacion.estado == estado)
    return query.order_by(Liquidacion.periodo.desc()).offset(skip).limit(limit).all()


@router.get("/{liq_id}", response_model=LiquidacionResponse)
def obtener_liquidacion(
    liq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    liq = db.query(Liquidacion).filter(Liquidacion.id == liq_id).first()
    if not liq:
        raise HTTPException(status_code=404, detail="Liquidación no encontrada")
    return liq


@router.post("/{liq_id}/autorizar", response_model=LiquidacionResponse)
def autorizar_liquidacion(
    liq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    liq = db.query(Liquidacion).filter(Liquidacion.id == liq_id).first()
    if not liq:
        raise HTTPException(status_code=404, detail="Liquidación no encontrada")
    if liq.estado != "calculada":
        raise HTTPException(status_code=400, detail=f"No se puede autorizar una liquidación en estado '{liq.estado}'")

    from datetime import datetime
    liq.estado = "autorizada"
    liq.autorizado_by = current_user.id
    liq.fecha_autorizacion = datetime.utcnow()
    db.commit()
    db.refresh(liq)
    return liq


@router.post("/{liq_id}/anular", response_model=LiquidacionResponse)
def anular_liquidacion(
    liq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    liq = db.query(Liquidacion).filter(Liquidacion.id == liq_id).first()
    if not liq:
        raise HTTPException(status_code=404, detail="Liquidación no encontrada")
    if liq.estado == "pagada":
        raise HTTPException(status_code=400, detail="No se puede anular una liquidación ya pagada")

    liq.estado = "anulada"
    db.commit()
    db.refresh(liq)
    return liq


@router.get("/stats/resumen")
def resumen_liquidaciones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    total = db.query(Liquidacion).filter(Liquidacion.estado != "anulada").count()
    autorizadas = db.query(Liquidacion).filter(Liquidacion.estado == "autorizada").count()
    pagadas = db.query(Liquidacion).filter(Liquidacion.estado == "pagada").count()
    total_pagado = db.query(func.sum(Liquidacion.haber_neto)).filter(
        Liquidacion.estado == "pagada"
    ).scalar() or 0

    return {
        "total_liquidaciones": total,
        "autorizadas": autorizadas,
        "pagadas": pagadas,
        "total_pagado": round(total_pagado, 2),
    }
