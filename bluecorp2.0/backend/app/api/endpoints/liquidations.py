from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import random, string, io
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user, require_operador
from app.models.user import User
from app.models.affiliate import Affiliate
from app.models.liquidation import Liquidacion, ItemLiquidacion
from app.schemas.liquidation import (
    LiquidacionCreate, LiquidacionSACCreate, LiquidacionRetroCreate,
    LiquidacionResponse, LiquidacionSummary, CalculoRequest, CalculoResponse
)
from app.engines.pension_engine import MotorCalculoPension, PeriodoLaboral, Remuneracion
from app.engines.movilidad_engine import MotorMovilidad
from app.engines.sac_engine import MotorSAC
from app.engines.retroactivo_engine import MotorRetroactivo
from app.engines.descuento_engine import MotorDescuentos
from app.utils.recibo_pdf import generar_recibo_pdf
from app.core.config import settings

router = APIRouter(prefix="/liquidations", tags=["Liquidaciones"])

COMPLEMENTO_ZONA = {
    "normal": 0.0,
    "desfavorable": 0.10,
    "muy_desfavorable": 0.20,
    "extrema": 0.30,
}


def _num_liq(db):
    while True:
        n = "LIQ-" + "".join(random.choices(string.digits, k=10))
        if not db.query(Liquidacion).filter(Liquidacion.numero_liquidacion == n).first():
            return n


def _build_calculo(afiliado: Affiliate, db: Session) -> dict:
    """Calcula el haber completo con descuentos para un afiliado."""
    motor = MotorCalculoPension()
    motor_movilidad = MotorMovilidad()
    motor_desc = MotorDescuentos()

    periodos = [
        PeriodoLaboral(fecha_inicio=p.fecha_inicio, fecha_fin=p.fecha_fin, tipo=p.tipo_relacion)
        for p in afiliado.periodos_laborales
    ]
    rems = [
        Remuneracion(periodo=r.periodo, importe=r.remuneracion_imponible)
        for r in afiliado.remuneraciones
    ]

    res = motor.calcular_jubilacion_ordinaria(
        fecha_nacimiento=afiliado.fecha_nacimiento,
        sexo=afiliado.sexo,
        periodos_laborales=periodos,
        remuneraciones=rems,
    )

    # Complemento zona
    zona = afiliado.zona or "normal"
    pct_zona = COMPLEMENTO_ZONA.get(zona, 0.0)
    comp_zona = res.haber_final * pct_zona

    haber_base = res.haber_final + comp_zona

    # Movilidad vigente (último ajuste)
    ultimo_mov = motor_movilidad.obtener_coeficiente_ultimo()
    pct_movilidad = ultimo_mov["pct"]
    coef_movilidad = 1.0 + pct_movilidad / 100.0

    # Actualizar haber_actual con movilidad acumulada
    haber_con_movilidad = afiliado.haber_actual if afiliado.haber_actual > 0 else haber_base

    # Descuentos (voluntarios activos)
    descuentos_data = [
        {
            "tipo": d.tipo,
            "descripcion": d.descripcion,
            "modalidad": d.modalidad,
            "importe_fijo": d.importe_fijo,
            "porcentaje": d.porcentaje,
            "base_calculo": d.base_calculo,
            "importe_por_cuota": d.importe_por_cuota,
            "prioridad": d.prioridad,
        }
        for d in afiliado.descuentos_voluntarios if d.activo
    ]

    resultado_desc = motor_desc.calcular(haber_con_movilidad, descuentos_data)

    # Clasificar descuentos por tipo
    sindicato = sum(d.importe_aplicado for d in resultado_desc.descuentos if d.tipo == "sindicato")
    mutual = sum(d.importe_aplicado for d in resultado_desc.descuentos if d.tipo == "mutual")
    embargo = sum(d.importe_aplicado for d in resultado_desc.descuentos if d.tipo == "embargo")
    pami = sum(d.importe_aplicado for d in resultado_desc.descuentos if d.tipo == "pami")
    otro = sum(
        d.importe_aplicado for d in resultado_desc.descuentos
        if d.tipo not in ("sindicato", "mutual", "embargo", "pami")
    )

    # Items del recibo
    items_haber = [
        {"codigo_concepto": "001", "concepto": "PBU - Prestación Básica Universal", "tipo": "haber", "importe": res.pbu},
        {"codigo_concepto": "002", "concepto": "PC - Prestación Compensatoria", "tipo": "haber", "importe": res.pc},
        {"codigo_concepto": "003", "concepto": "PAP - Prestación Adicional por Permanencia", "tipo": "haber", "importe": res.pap},
    ]
    if comp_zona > 0:
        items_haber.append({
            "codigo_concepto": "004", "tipo": "haber",
            "concepto": f"Complemento Zona {zona.replace('_', ' ').title()}",
            "importe": comp_zona, "porcentaje": pct_zona * 100, "base_calculo": res.haber_final,
        })

    items_descuento = []
    for d in resultado_desc.descuentos:
        items_descuento.append({
            "codigo_concepto": "90" + d.tipo[:1].upper(),
            "concepto": d.descripcion + (" [LIMITADO]" if d.fue_tronchado else ""),
            "tipo": "descuento",
            "importe": d.importe_aplicado,
            "base_calculo": d.base_calculo,
        })

    return {
        "pbu": res.pbu,
        "pc": res.pc,
        "pap": res.pap,
        "complemento_zona": comp_zona,
        "haber_bruto": res.haber_bruto + comp_zona,
        "haber_minimo_garantizado": settings.HABER_MINIMO_VIGENTE,
        "coeficiente_movilidad": coef_movilidad,
        "porcentaje_movilidad": pct_movilidad,
        "haber_con_movilidad": haber_con_movilidad,
        "descuento_pami": pami,
        "descuento_sindicato": sindicato,
        "descuento_mutual": mutual,
        "descuento_embargo": embargo,
        "descuento_otro": otro,
        "total_descuentos": resultado_desc.total_descuentos,
        "haber_neto": resultado_desc.haber_neto,
        "items": items_haber + items_descuento,
        "detalle_calculo": res.detalle_calculo,
        "cumple_requisitos": res.tiene_derecho,
        "observaciones": res.observaciones,
    }


@router.post("/calcular", response_model=CalculoResponse)
def calcular_previo(
    request: CalculoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    afiliado = db.query(Affiliate).filter(Affiliate.id == request.afiliado_id).first()
    if not afiliado:
        raise HTTPException(404, "Afiliado no encontrado")
    c = _build_calculo(afiliado, db)
    return CalculoResponse(
        afiliado_id=request.afiliado_id,
        periodo=request.periodo,
        pbu=c["pbu"], pc=c["pc"], pap=c["pap"],
        complemento_zona=c["complemento_zona"],
        haber_bruto=c["haber_bruto"],
        haber_minimo_garantizado=c["haber_minimo_garantizado"],
        coeficiente_movilidad=c["coeficiente_movilidad"],
        porcentaje_movilidad=c["porcentaje_movilidad"],
        haber_con_movilidad=c["haber_con_movilidad"],
        descuento_pami=c["descuento_pami"],
        total_descuentos=c["total_descuentos"],
        haber_neto=c["haber_neto"],
        detalle_calculo=c["detalle_calculo"],
        cumple_requisitos=c["cumple_requisitos"],
        observaciones=c["observaciones"],
        items=c["items"],
    )


@router.post("/", response_model=LiquidacionResponse, status_code=201)
def crear_liquidacion(
    data: LiquidacionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    afiliado = db.query(Affiliate).filter(Affiliate.id == data.afiliado_id).first()
    if not afiliado:
        raise HTTPException(404, "Afiliado no encontrado")

    existente = db.query(Liquidacion).filter(
        Liquidacion.afiliado_id == data.afiliado_id,
        Liquidacion.periodo == data.periodo,
        Liquidacion.tipo == data.tipo,
        Liquidacion.estado != "anulada",
    ).first()
    if existente:
        raise HTTPException(400, f"Ya existe liquidación {data.tipo} para {data.periodo}")

    c = _build_calculo(afiliado, db)

    liq = Liquidacion(
        afiliado_id=data.afiliado_id,
        numero_liquidacion=_num_liq(db),
        tipo=data.tipo,
        estado="calculada",
        periodo=data.periodo,
        fecha_pago=data.fecha_pago,
        pbu=c["pbu"], pc=c["pc"], pap=c["pap"],
        complemento_zona=c["complemento_zona"],
        haber_bruto=c["haber_bruto"],
        haber_minimo_garantizado=c["haber_minimo_garantizado"],
        coeficiente_movilidad=c["coeficiente_movilidad"],
        porcentaje_movilidad=c["porcentaje_movilidad"],
        haber_con_movilidad=c["haber_con_movilidad"],
        descuento_pami=c["descuento_pami"],
        descuento_sindicato=c["descuento_sindicato"],
        descuento_mutual=c["descuento_mutual"],
        descuento_embargo=c["descuento_embargo"],
        descuento_otro=c["descuento_otro"],
        total_descuentos=c["total_descuentos"],
        haber_neto=c["haber_neto"],
        banco_pago=afiliado.banco,
        cbu_pago=afiliado.cbu,
        forma_pago=afiliado.forma_pago,
        observaciones=data.observaciones,
        created_by=current_user.id,
    )
    db.add(liq)
    db.flush()

    for item in c["items"]:
        db.add(ItemLiquidacion(liquidacion_id=liq.id, **item))

    db.commit()
    db.refresh(liq)
    return liq


@router.post("/sac", response_model=LiquidacionResponse, status_code=201)
def crear_sac(
    data: LiquidacionSACCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    """Genera la liquidación del SAC (Sueldo Anual Complementario)."""
    afiliado = db.query(Affiliate).filter(Affiliate.id == data.afiliado_id).first()
    if not afiliado:
        raise HTTPException(404, "Afiliado no encontrado")

    # Recopilar haberes del semestre
    mes_inicio = 1 if data.semestre == 1 else 7
    mes_fin = 6 if data.semestre == 1 else 12
    periodo_sac = f"{data.anio}-{'06' if data.semestre == 1 else '12'}"

    liq_semestre = db.query(Liquidacion).filter(
        Liquidacion.afiliado_id == data.afiliado_id,
        Liquidacion.tipo == "mensual",
        Liquidacion.estado.in_(["pagada", "autorizada"]),
        Liquidacion.periodo >= f"{data.anio}-{mes_inicio:02d}",
        Liquidacion.periodo <= f"{data.anio}-{mes_fin:02d}",
    ).all()

    haberes = [l.haber_neto for l in liq_semestre] or [afiliado.haber_actual]
    resultado_sac = MotorSAC.calcular_sac(haberes, data.semestre, data.anio, len(haberes))

    liq = Liquidacion(
        afiliado_id=data.afiliado_id,
        numero_liquidacion=_num_liq(db),
        tipo="sac",
        estado="calculada",
        periodo=periodo_sac,
        mejor_haber_semestre=resultado_sac.mejor_haber,
        importe_sac=resultado_sac.importe_final,
        haber_bruto=resultado_sac.importe_final,
        haber_con_movilidad=resultado_sac.importe_final,
        descuento_pami=round(resultado_sac.importe_final * settings.TASA_PAMI, 2),
        total_descuentos=round(resultado_sac.importe_final * settings.TASA_PAMI, 2),
        haber_neto=round(resultado_sac.importe_final * (1 - settings.TASA_PAMI), 2),
        banco_pago=afiliado.banco,
        cbu_pago=afiliado.cbu,
        forma_pago=afiliado.forma_pago,
        observaciones=data.observaciones,
        created_by=current_user.id,
    )
    db.add(liq)
    db.flush()
    db.add(ItemLiquidacion(
        liquidacion_id=liq.id,
        codigo_concepto="SAC",
        concepto=f"SAC {resultado_sac.semestre} — 50% mejor haber",
        tipo="haber",
        importe=resultado_sac.importe_final,
        porcentaje=50.0,
        base_calculo=resultado_sac.mejor_haber,
    ))
    db.add(ItemLiquidacion(
        liquidacion_id=liq.id,
        codigo_concepto="901",
        concepto="PAMI (Ley 19.032) - 3%",
        tipo="descuento",
        importe=liq.descuento_pami,
        porcentaje=3.0,
        base_calculo=resultado_sac.importe_final,
    ))
    db.commit()
    db.refresh(liq)
    return liq


@router.post("/retroactivo", response_model=LiquidacionResponse, status_code=201)
def crear_retroactivo(
    data: LiquidacionRetroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    """Genera una liquidación de retroactivo entre dos períodos."""
    afiliado = db.query(Affiliate).filter(Affiliate.id == data.afiliado_id).first()
    if not afiliado:
        raise HTTPException(404, "Afiliado no encontrado")

    res = MotorRetroactivo.calcular_retroactivo(
        haber_base_inicio=data.haber_base,
        periodo_desde=data.periodo_desde,
        periodo_hasta=data.periodo_hasta,
    )

    periodo_liq = data.periodo_hasta  # Se imputa al último período
    cantidad = len([p for p in res.periodos if p.diferencia > 0])

    liq = Liquidacion(
        afiliado_id=data.afiliado_id,
        numero_liquidacion=_num_liq(db),
        tipo="retroactivo",
        estado="calculada",
        periodo=periodo_liq,
        meses_retroactivo=res.cantidad_periodos,
        importe_retroactivo=res.total_actualizado,
        periodo_retro_desde=data.periodo_desde,
        periodo_retro_hasta=data.periodo_hasta,
        haber_bruto=res.total_actualizado,
        haber_con_movilidad=res.total_actualizado,
        descuento_pami=round(res.total_actualizado * settings.TASA_PAMI, 2),
        total_descuentos=round(res.total_actualizado * settings.TASA_PAMI, 2),
        haber_neto=round(res.total_actualizado * (1 - settings.TASA_PAMI), 2),
        banco_pago=afiliado.banco,
        cbu_pago=afiliado.cbu,
        forma_pago=afiliado.forma_pago,
        observaciones=data.observaciones,
        created_by=current_user.id,
    )
    db.add(liq)
    db.flush()
    db.add(ItemLiquidacion(
        liquidacion_id=liq.id,
        codigo_concepto="RET",
        concepto=f"Retroactivo {data.periodo_desde} a {data.periodo_hasta} ({res.cantidad_periodos} períodos)",
        tipo="haber",
        importe=res.total_actualizado,
    ))
    db.add(ItemLiquidacion(
        liquidacion_id=liq.id, codigo_concepto="901",
        concepto="PAMI (Ley 19.032) - 3%", tipo="descuento",
        importe=liq.descuento_pami, porcentaje=3.0,
        base_calculo=res.total_actualizado,
    ))
    db.commit()
    db.refresh(liq)
    return liq


@router.get("/", response_model=List[LiquidacionSummary])
def listar_liquidaciones(
    skip: int = 0, limit: int = 200,
    afiliado_id: Optional[int] = None,
    periodo: Optional[str] = None,
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Liquidacion)
    if afiliado_id:
        q = q.filter(Liquidacion.afiliado_id == afiliado_id)
    if periodo:
        q = q.filter(Liquidacion.periodo == periodo)
    if estado:
        q = q.filter(Liquidacion.estado == estado)
    if tipo:
        q = q.filter(Liquidacion.tipo == tipo)
    return q.order_by(Liquidacion.periodo.desc()).offset(skip).limit(limit).all()


@router.get("/stats/resumen")
def resumen_liquidaciones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    total = db.query(Liquidacion).filter(Liquidacion.estado != "anulada").count()
    autorizadas = db.query(Liquidacion).filter(Liquidacion.estado == "autorizada").count()
    pagadas = db.query(Liquidacion).filter(Liquidacion.estado == "pagada").count()
    masa = db.query(func.sum(Liquidacion.haber_neto)).filter(Liquidacion.estado == "pagada").scalar() or 0
    return {"total_liquidaciones": total, "autorizadas": autorizadas, "pagadas": pagadas, "masa_pagada": round(masa, 2)}


@router.get("/{liq_id}", response_model=LiquidacionResponse)
def obtener_liquidacion(
    liq_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    liq = db.query(Liquidacion).filter(Liquidacion.id == liq_id).first()
    if not liq:
        raise HTTPException(404, "Liquidación no encontrada")
    return liq


@router.post("/{liq_id}/autorizar", response_model=LiquidacionResponse)
def autorizar(
    liq_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    liq = db.query(Liquidacion).filter(Liquidacion.id == liq_id).first()
    if not liq:
        raise HTTPException(404, "Liquidación no encontrada")
    if liq.estado != "calculada":
        raise HTTPException(400, f"No se puede autorizar estado '{liq.estado}'")
    liq.estado = "autorizada"
    liq.autorizado_by = current_user.id
    liq.fecha_autorizacion = datetime.utcnow()
    db.commit()
    db.refresh(liq)
    return liq


@router.post("/{liq_id}/anular", response_model=LiquidacionResponse)
def anular(
    liq_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_operador),
):
    liq = db.query(Liquidacion).filter(Liquidacion.id == liq_id).first()
    if not liq:
        raise HTTPException(404, "Liquidación no encontrada")
    if liq.estado == "pagada":
        raise HTTPException(400, "No se puede anular liquidación pagada")
    liq.estado = "anulada"
    db.commit()
    db.refresh(liq)
    return liq


@router.get("/{liq_id}/recibo")
def descargar_recibo(
    liq_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Genera y descarga el recibo de haberes en PDF."""
    liq = db.query(Liquidacion).filter(Liquidacion.id == liq_id).first()
    if not liq:
        raise HTTPException(404, "Liquidación no encontrada")
    afiliado = liq.afiliado

    items_haber = [
        {"codigo_concepto": i.codigo_concepto, "concepto": i.concepto,
         "importe": i.importe, "porcentaje": i.porcentaje, "base_calculo": i.base_calculo}
        for i in liq.items if i.tipo == "haber"
    ]
    items_desc = [
        {"codigo_concepto": i.codigo_concepto, "concepto": i.concepto,
         "importe": i.importe, "porcentaje": i.porcentaje, "base_calculo": i.base_calculo}
        for i in liq.items if i.tipo == "descuento"
    ]

    TIPO_LABEL = {
        "jubilacion_ordinaria": "Jubilación Ordinaria",
        "retiro_invalidez": "Retiro por Invalidez",
        "pension_fallecimiento": "Pensión por Fallecimiento",
        "pua": "PUA",
    }

    pdf_bytes = generar_recibo_pdf(
        afiliado_nombre=f"{afiliado.apellido}, {afiliado.nombre}",
        afiliado_cuil=afiliado.cuil,
        numero_beneficio=afiliado.numero_beneficio or "",
        tipo_prestacion=TIPO_LABEL.get(afiliado.tipo_prestacion, afiliado.tipo_prestacion),
        periodo=liq.periodo,
        items_haber=items_haber,
        items_descuento=items_desc,
        haber_bruto=liq.haber_con_movilidad,
        total_descuentos=liq.total_descuentos,
        haber_neto=liq.haber_neto,
        banco=liq.banco_pago,
        cbu=liq.cbu_pago,
        forma_pago=liq.forma_pago or "Acreditación bancaria",
        numero_liquidacion=liq.numero_liquidacion or str(liq.id),
    )

    filename = f"recibo_{liq.numero_liquidacion}_{liq.periodo}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
