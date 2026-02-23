"""
Motor de Cálculo de Retroactivos Previsionales
===============================================
Los retroactivos ocurren cuando:
  a) Se otorga una prestación con efecto retroactivo desde la fecha de solicitud.
  b) Se aplica un aumento de movilidad que no fue cobrado en su momento.
  c) Se corrige un error en el haber (subdeclaración de aportes, etc.).
  d) Se produce un reajuste judicial/administrativo.

Cálculo:
  Por cada período retroactivo:
    haber_que_debió_cobrar - haber_que_cobró = diferencia_período
  Suma de todas las diferencias = retroactivo total.

  Si el beneficiario NO cobró nada (alta retroactiva):
    haber_que_debió_cobrar_período = haber_calculado × coeficiente_movilidad_del_período

Actualización:
  La Ley 26.153 y jurisprudencia CSJN ("Badaro", "Elliff") establecen
  que los retroactivos deben actualizarse con los mismos coeficientes de
  movilidad que se aplicaron en cada período.
"""

from dataclasses import dataclass, field
from typing import List, Optional
from app.engines.movilidad_engine import TABLA_MOVILIDAD_HISTORICA


@dataclass
class PeriodoRetroactivo:
    periodo: str           # YYYY-MM
    haber_correcto: float  # Haber que debió cobrar
    haber_cobrado: float   # Haber que efectivamente cobró (0 si no cobró nada)
    diferencia: float = 0.0

    def __post_init__(self):
        self.diferencia = max(0.0, self.haber_correcto - self.haber_cobrado)


@dataclass
class ResultadoRetroactivo:
    periodos: List[PeriodoRetroactivo]
    total_sin_actualizar: float
    total_actualizado: float
    cantidad_periodos: int
    periodo_desde: str
    periodo_hasta: str
    detalle: dict = field(default_factory=dict)


class MotorRetroactivo:

    @staticmethod
    def calcular_retroactivo(
        haber_base_inicio: float,
        periodo_desde: str,
        periodo_hasta: str,
        haberes_cobrados: Optional[dict] = None,  # {periodo: importe_cobrado}
    ) -> ResultadoRetroactivo:
        """
        Calcula el retroactivo desde periodo_desde hasta periodo_hasta.

        haber_base_inicio: haber que debió cobrar en el primer período.
        haberes_cobrados: dict {YYYY-MM: importe} de lo que efectivamente cobró.
                         Si es None, se asume que no cobró nada.
        """
        haberes_cobrados = haberes_cobrados or {}

        # Obtener todos los períodos en el rango
        todos_periodos = MotorRetroactivo._generar_periodos_mensuales(
            periodo_desde, periodo_hasta
        )

        # Calcular movilidades acumuladas para cada período
        movilidades = MotorRetroactivo._movilidades_por_periodo(
            periodo_desde, periodo_hasta
        )

        periodos_retro: List[PeriodoRetroactivo] = []
        haber_actual = haber_base_inicio

        for periodo in todos_periodos:
            # Aplicar movilidad del período si existe
            if periodo in movilidades:
                haber_actual *= movilidades[periodo]

            haber_cobrado = haberes_cobrados.get(periodo, 0.0)
            pr = PeriodoRetroactivo(
                periodo=periodo,
                haber_correcto=round(haber_actual, 2),
                haber_cobrado=round(haber_cobrado, 2),
            )
            periodos_retro.append(pr)

        total_sin_actualizar = sum(p.diferencia for p in periodos_retro)

        # Actualización con el coeficiente al momento del pago
        # (simplificación: se paga al valor actual sin actualización adicional)
        total_actualizado = total_sin_actualizar

        return ResultadoRetroactivo(
            periodos=periodos_retro,
            total_sin_actualizar=round(total_sin_actualizar, 2),
            total_actualizado=round(total_actualizado, 2),
            cantidad_periodos=len(periodos_retro),
            periodo_desde=periodo_desde,
            periodo_hasta=periodo_hasta,
            detalle={
                "formula": "Retroactivo = Σ (haber_correcto - haber_cobrado) por período",
                "periodos_con_diferencia": sum(1 for p in periodos_retro if p.diferencia > 0),
                "ley_referencia": "Ley 26.153 / CSJN 'Badaro' / 'Elliff'",
            },
        )

    @staticmethod
    def _generar_periodos_mensuales(desde: str, hasta: str) -> List[str]:
        """Genera lista de períodos YYYY-MM entre dos fechas."""
        from datetime import date
        y_d, m_d = int(desde[:4]), int(desde[5:7])
        y_h, m_h = int(hasta[:4]), int(hasta[5:7])
        periodos = []
        y, m = y_d, m_d
        while (y, m) <= (y_h, m_h):
            periodos.append(f"{y:04d}-{m:02d}")
            m += 1
            if m > 12:
                m = 1
                y += 1
        return periodos

    @staticmethod
    def _movilidades_por_periodo(desde: str, hasta: str) -> dict:
        """Retorna dict {periodo: coeficiente} de movilidades en el rango."""
        result = {}
        for entry in TABLA_MOVILIDAD_HISTORICA:
            # Convertir período de movilidad a mensual
            periodo_mov = entry["periodo"]
            fecha_desde = entry["desde"][:7]  # YYYY-MM
            coef = 1.0 + entry["pct"] / 100.0
            if desde <= fecha_desde <= hasta:
                result[fecha_desde] = coef
        return result
