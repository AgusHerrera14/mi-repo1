"""
Blue Corp — Motores de Cálculo Previsional
==========================================
Módulos disponibles:

  Módulo 1 — derecho_engine:    Determinación del derecho previsional
  Módulo 2 — haber_engine:      Cálculo del haber jubilatorio inicial
  Módulo 3 — reajuste_engine:   Reajuste judicial de haberes
  Módulo 4 — ejecucion_engine:  Liquidación de ejecución de sentencias

  Soporte:
    indices_data:     Índices INGR, RIPTE, Movilidad, Topes, Tasas
    movilidad_engine: Motor de movilidad trimestral/mensual (Ley 26.417 / DL 274/2024)
    descuento_engine: Descuentos obligatorios (PAMI, aportes)
    sac_engine:       Sueldo Anual Complementario
    retroactivo_engine: Cálculo de retroactivos
"""

# ── Módulo 1: Derecho ────────────────────────────────────────────────────────
from .derecho_engine import (
    MotorDerecho,
    ServicioImportado,
    ResultadoDerecho,
)

# ── Módulo 2: Haber ──────────────────────────────────────────────────────────
from .haber_engine import (
    MotorHaber,
    PeriodoLaboral,
    Remuneracion,
    ResultadoHaber,
)

# ── Módulo 3: Reajuste ───────────────────────────────────────────────────────
from .reajuste_engine import (
    MotorReajuste,
    HaberPercibido,
    DiferenciaMensual,
    ResultadoReajuste,
)

# ── Módulo 4: Ejecución ──────────────────────────────────────────────────────
from .ejecucion_engine import (
    MotorEjecucion,
    ParametrosSentencia,
    LineaLiquidacion,
    ResultadoEjecucion,
)

# ── Soporte: Índices ─────────────────────────────────────────────────────────
from .indices_data import (
    INGR_HISTORICO,
    RIPTE_HISTORICO,
    MOVILIDAD_HISTORICA,
    TOPES_HISTORICOS,
    TASAS_INTERES,
    obtener_ripte_periodo,
    obtener_ingr_periodo,
    obtener_movilidad_acum,
    obtener_haber_minimo_periodo,
    obtener_haber_maximo_periodo,
    obtener_tasa_interes_periodo,
)

# ── Soporte: Movilidad (compatibilidad hacia atrás) ──────────────────────────
from .movilidad_engine import (
    MotorMovilidad,
    ResultadoMovilidad,
    TABLA_MOVILIDAD_HISTORICA,
)

__all__ = [
    # Módulo 1
    "MotorDerecho",
    "ServicioImportado",
    "ResultadoDerecho",
    # Módulo 2
    "MotorHaber",
    "PeriodoLaboral",
    "Remuneracion",
    "ResultadoHaber",
    # Módulo 3
    "MotorReajuste",
    "HaberPercibido",
    "DiferenciaMensual",
    "ResultadoReajuste",
    # Módulo 4
    "MotorEjecucion",
    "ParametrosSentencia",
    "LineaLiquidacion",
    "ResultadoEjecucion",
    # Índices
    "INGR_HISTORICO",
    "RIPTE_HISTORICO",
    "MOVILIDAD_HISTORICA",
    "TOPES_HISTORICOS",
    "TASAS_INTERES",
    "obtener_ripte_periodo",
    "obtener_ingr_periodo",
    "obtener_movilidad_acum",
    "obtener_haber_minimo_periodo",
    "obtener_haber_maximo_periodo",
    "obtener_tasa_interes_periodo",
    # Movilidad
    "MotorMovilidad",
    "ResultadoMovilidad",
    "TABLA_MOVILIDAD_HISTORICA",
]
