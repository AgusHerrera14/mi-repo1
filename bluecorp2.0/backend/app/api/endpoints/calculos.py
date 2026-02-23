"""API endpoints para cálculos previsionales - Blue Corp."""
from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.ficha import Ficha, Servicio, Remuneracion, CalculoDerecho, CalculoHaber, CalculoReajuste
from app.models.user import User
from app.engines.derecho_engine import MotorDerecho, ServicioImportado
from app.engines.haber_engine import MotorHaber, PeriodoLaboral, Remuneracion as RemEngine
from app.engines.reajuste_engine import MotorReajuste, HaberPercibido

router = APIRouter(prefix="/calculos", tags=["calculos"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CalculoDerechoRequest(BaseModel):
    ficha_id: UUID
    fecha_calculo: Optional[date] = None

class CalculoHaberRequest(BaseModel):
    ficha_id: UUID
    fecha_calculo: Optional[date] = None
    tipo_calculo: str = "estimado"

class HaberPercibidoItem(BaseModel):
    periodo: str
    importe: float

class CalculoReajusteRequest(BaseModel):
    ficha_id: UUID
    tipo_reajuste: str = "solo_movilidad"
    haber_base: float
    periodo_base: str
    periodo_inicio: str
    periodo_fin: str
    haberes_percibidos: List[HaberPercibidoItem] = []
    calcular_intereses: bool = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/derecho")
def calcular_derecho(
    req: CalculoDerechoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Módulo 1: Determina si la ficha tiene derecho a la prestación."""
    ficha = db.query(Ficha).filter(Ficha.id == req.ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")

    servicios_importados = [
        ServicioImportado(
            periodo=f"{s.fecha_inicio.year:04d}-{s.fecha_inicio.month:02d}",
            empleador=s.empleador or "",
            tipo_relacion="RL" if s.tipo == "dependencia" else "AU",
            tiene_aportes=True,
        )
        for s in ficha.servicios
    ]

    motor = MotorDerecho()
    resultado = motor.determinar_jubilacion_ordinaria(
        fecha_nacimiento=ficha.fecha_nacimiento,
        sexo=ficha.sexo,
        servicios=servicios_importados,
        fecha_calculo=req.fecha_calculo,
    )

    # Guardar resultado
    calc = CalculoDerecho(
        ficha_id=ficha.id,
        fecha_calculo=req.fecha_calculo or date.today(),
        tipo_beneficio=ficha.tipo_beneficio,
        tiene_derecho=resultado.tiene_derecho,
        cumple_edad=resultado.cumple_edad,
        edad_actual=resultado.edad_actual,
        edad_requerida=resultado.edad_requerida,
        meses_faltantes_edad=resultado.meses_faltantes_edad,
        anios_totales=resultado.anios_totales,
        anios_pre_sijp=resultado.anios_pre_sijp,
        anios_post_sijp=resultado.anios_post_sijp,
        cumple_aportes=resultado.cumple_aportes,
        meses_faltantes_aportes=resultado.meses_faltantes_aportes,
        porcentaje_regularidad=resultado.porcentaje_regularidad,
        cumple_regularidad=resultado.cumple_regularidad,
        diagnostico=resultado.diagnostico,
        observaciones=resultado.observaciones,
        resultado_completo=resultado.detalle,
    )
    db.add(calc)
    db.commit()

    return {
        "ficha_id": str(req.ficha_id),
        "apellido_nombre": ficha.apellido_nombre,
        "tipo_beneficio": ficha.tipo_beneficio,
        **resultado.__dict__
    }


@router.post("/haber")
def calcular_haber(
    req: CalculoHaberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Módulo 2: Calcula el haber jubilatorio inicial (PBU+PC+PAP)."""
    ficha = db.query(Ficha).filter(Ficha.id == req.ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")

    periodos = [
        PeriodoLaboral(
            fecha_inicio=s.fecha_inicio,
            fecha_fin=s.fecha_fin,
            tipo=s.tipo,
            regimen=s.regimen,
            empleador=s.empleador,
            porcentaje=s.porcentaje,
        )
        for s in ficha.servicios
    ]

    remuneraciones = [
        RemEngine(periodo=r.periodo, importe_nominal=r.importe_nominal, tipo=r.tipo)
        for r in ficha.remuneraciones
    ]

    motor = MotorHaber(fecha_calculo=req.fecha_calculo)
    resultado = motor.calcular_jubilacion_ordinaria(
        fecha_nacimiento=ficha.fecha_nacimiento,
        sexo=ficha.sexo,
        periodos=periodos,
        remuneraciones=remuneraciones,
        tipo_calculo=req.tipo_calculo,
    )

    # Guardar resultado
    calc = CalculoHaber(
        ficha_id=ficha.id,
        fecha_calculo=req.fecha_calculo or date.today(),
        tipo_beneficio=ficha.tipo_beneficio,
        tipo_calculo=req.tipo_calculo,
        pbu=resultado.pbu,
        pc=resultado.pc,
        pap=resultado.pap,
        pap_transitoria=resultado.pap_transitoria,
        haber_bruto=resultado.haber_bruto,
        haber_minimo_vigente=resultado.haber_minimo_vigente,
        haber_maximo_vigente=resultado.haber_maximo_vigente,
        haber_final=resultado.haber_final,
        complemento_minimo=resultado.complemento_minimo,
        pbci=resultado.pbci,
        anios_pre_sijp=resultado.anios_pre_sijp,
        anios_post_sijp=resultado.anios_post_sijp,
        anios_totales=resultado.anios_totales,
        resultado_completo=resultado.detalle,
    )
    db.add(calc)
    db.commit()

    return {
        "ficha_id": str(req.ficha_id),
        "apellido_nombre": ficha.apellido_nombre,
        **resultado.__dict__
    }


@router.post("/reajuste")
def calcular_reajuste(
    req: CalculoReajusteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Módulo 3: Calcula el reajuste judicial de haberes."""
    ficha = db.query(Ficha).filter(Ficha.id == req.ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")

    haberes_percibidos = [
        HaberPercibido(periodo=h.periodo, importe=h.importe)
        for h in req.haberes_percibidos
    ]

    motor = MotorReajuste()
    if req.tipo_reajuste == "solo_movilidad":
        resultado = motor.calcular_solo_movilidad(
            haber_base=req.haber_base,
            periodo_base=req.periodo_base,
            periodo_inicio=req.periodo_inicio,
            periodo_fin=req.periodo_fin,
            haberes_percibidos=haberes_percibidos,
            calcular_intereses=req.calcular_intereses,
        )
    elif req.tipo_reajuste == "badaro":
        resultado = motor.calcular_badaro(
            haber_enero_2002=req.haber_base,
            haberes_percibidos=haberes_percibidos,
        )
    elif req.tipo_reajuste == "delaude":
        resultado = motor.calcular_delaude(
            haber_diciembre_2020=req.haber_base,
            haberes_percibidos=haberes_percibidos,
        )
    else:
        raise HTTPException(status_code=400, detail=f"Tipo de reajuste no soportado: {req.tipo_reajuste}")

    # Guardar resultado
    diferencias_json = [
        {
            "periodo": d.periodo,
            "haber_percibido": d.haber_percibido,
            "haber_reajustado": d.haber_reajustado,
            "diferencia": d.diferencia,
            "porcentaje_reajuste": d.porcentaje_reajuste,
            "coeficiente": d.coeficiente_movilidad,
        }
        for d in resultado.diferencias
    ]
    calc = CalculoReajuste(
        ficha_id=ficha.id,
        fecha_calculo=date.today(),
        tipo_reajuste=req.tipo_reajuste,
        periodo_inicio=req.periodo_inicio,
        periodo_fin=req.periodo_fin,
        haber_base=req.haber_base,
        periodo_base=req.periodo_base,
        retroactivo_bruto=resultado.retroactivo_bruto,
        intereses_punitorios=resultado.intereses_punitorios,
        intereses_resarcitorios=resultado.intereses_resarcitorios,
        total_credito=resultado.total_credito,
        diferencias_mensuales=diferencias_json,
        resultado_completo=resultado.detalle,
    )
    db.add(calc)
    db.commit()

    return {
        "ficha_id": str(req.ficha_id),
        "apellido_nombre": ficha.apellido_nombre,
        "diferencias": diferencias_json,
        "retroactivo_bruto": resultado.retroactivo_bruto,
        "intereses_punitorios": resultado.intereses_punitorios,
        "intereses_resarcitorios": resultado.intereses_resarcitorios,
        "total_credito": resultado.total_credito,
        "meses_calculados": resultado.meses_calculados,
        "meses_con_diferencia": resultado.meses_con_diferencia_positiva,
        "observaciones": resultado.observaciones,
        "detalle": resultado.detalle,
    }


@router.get("/historial/{ficha_id}")
def get_historial_calculos(
    ficha_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna todos los cálculos realizados para una ficha."""
    ficha = db.query(Ficha).filter(Ficha.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    
    derechos = db.query(CalculoDerecho).filter(CalculoDerecho.ficha_id == ficha_id).order_by(CalculoDerecho.created_at.desc()).all()
    haberes = db.query(CalculoHaber).filter(CalculoHaber.ficha_id == ficha_id).order_by(CalculoHaber.created_at.desc()).all()
    reajustes = db.query(CalculoReajuste).filter(CalculoReajuste.ficha_id == ficha_id).order_by(CalculoReajuste.created_at.desc()).all()

    return {
        "ficha_id": str(ficha_id),
        "apellido_nombre": ficha.apellido_nombre,
        "calculos_derecho": [{"id": c.id, "fecha": str(c.fecha_calculo), "tiene_derecho": c.tiene_derecho, "diagnostico": c.diagnostico} for c in derechos],
        "calculos_haber": [{"id": c.id, "fecha": str(c.fecha_calculo), "haber_final": c.haber_final, "pbu": c.pbu, "pc": c.pc, "pap": c.pap} for c in haberes],
        "calculos_reajuste": [{"id": c.id, "fecha": str(c.fecha_calculo), "tipo": c.tipo_reajuste, "total_credito": c.total_credito} for c in reajustes],
    }
