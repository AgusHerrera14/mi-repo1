"""Herramientas Previsionales - datos de referencia - Blue Corp."""
from fastapi import APIRouter
from app.engines.indices_data import (
    TOPES_HISTORICOS, RIPTE_HISTORICO, MOVILIDAD_HISTORICA, TASAS_INTERES,
    obtener_haber_minimo_periodo, obtener_ripte_periodo
)

router = APIRouter(prefix="/herramientas", tags=["herramientas"])

@router.get("/topes")
def get_topes_historicos():
    """Tabla histórica de haberes mínimos y máximos."""
    return {"topes": TOPES_HISTORICOS}

@router.get("/ripte")
def get_ripte_historico():
    """Tabla histórica de RIPTE."""
    return {"ripte": RIPTE_HISTORICO}

@router.get("/movilidad")
def get_movilidad_historica():
    """Tabla histórica de movilidad previsional."""
    return {"movilidad": MOVILIDAD_HISTORICA}

@router.get("/tasas-interes")
def get_tasas_interes():
    """Tasas de interés Res. 589/2019."""
    return {"tasas": TASAS_INTERES}

@router.get("/vigente")
def get_valores_vigentes():
    """Valores vigentes para el mes actual."""
    from datetime import date
    periodo = date.today().strftime("%Y-%m")
    return {
        "periodo": periodo,
        "haber_minimo": obtener_haber_minimo_periodo(periodo),
        "ripte": obtener_ripte_periodo(periodo),
    }
