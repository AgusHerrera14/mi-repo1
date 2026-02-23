from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.engines.movilidad_engine import MotorMovilidad, TABLA_MOVILIDAD_HISTORICA

router = APIRouter(prefix="/movilidad", tags=["Movilidad"])


@router.get("/tabla")
def obtener_tabla_completa(
    current_user: User = Depends(get_current_user),
):
    """Retorna la tabla completa de coeficientes de movilidad históricos."""
    return TABLA_MOVILIDAD_HISTORICA


@router.get("/ultimo")
def obtener_ultimo_coeficiente(
    current_user: User = Depends(get_current_user),
):
    """Retorna el último coeficiente de movilidad aplicado."""
    motor = MotorMovilidad()
    return motor.obtener_coeficiente_ultimo()


@router.post("/aplicar")
def aplicar_movilidad(
    haber_base: float,
    periodo_inicio: str,
    periodo_fin: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Aplica los coeficientes de movilidad a un haber base dado,
    desde el período indicado hasta el período fin (o el último disponible).
    """
    motor = MotorMovilidad()
    try:
        resultado = motor.aplicar_movilidad(haber_base, periodo_inicio, periodo_fin)
        return {
            "haber_original": resultado.haber_original,
            "haber_actualizado": resultado.haber_actualizado,
            "coeficiente_aplicado": resultado.coeficiente_aplicado,
            "porcentaje_total": resultado.porcentaje_total,
            "periodo_desde": resultado.periodo_desde,
            "periodo_hasta": resultado.periodo_hasta,
            "cantidad_periodos": len(resultado.periodos_aplicados),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/simulador")
def simular_proyeccion(
    haber_actual: float,
    periodos_proyeccion: int = 12,
    tasa_estimada: float = 2.0,
    current_user: User = Depends(get_current_user),
):
    """
    Proyecta el haber a futuro usando una tasa de movilidad estimada mensual.
    Solo es una proyección orientativa; no representa una promesa legal.
    """
    proyeccion = []
    haber = haber_actual
    for i in range(1, periodos_proyeccion + 1):
        haber *= 1.0 + tasa_estimada / 100.0
        proyeccion.append({
            "mes": i,
            "haber_proyectado": round(haber, 2),
            "variacion_acumulada_pct": round(((haber / haber_actual) - 1) * 100, 2),
        })

    return {
        "haber_base": haber_actual,
        "tasa_estimada_mensual": tasa_estimada,
        "periodos": periodos_proyeccion,
        "proyeccion": proyeccion,
        "advertencia": "Proyección orientativa. No refleja aumentos legales futuros.",
    }
