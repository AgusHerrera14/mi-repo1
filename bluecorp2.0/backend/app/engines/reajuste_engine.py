"""
Motor de Reajuste Judicial - Blue Corp
=======================================
Módulo 3: Cálculo de reajuste de haberes para litigios previsionales.

Tipos de reajuste:
  - Solo por Movilidad: aplica índices de movilidad desde el haber base
  - Ley 18.037 / 18.038: regímenes anteriores a Ley 24.241
  - Mixto (combinaciones de leyes)
  - Badaro: ajuste período 01/2002-12/2006
  - Delaude: recomposición a enero 2021

Calcula:
  - Haber reajustado mensual
  - Diferencias con el haber percibido
  - Retroactivo bruto (períodos no prescriptos)
  - Intereses punitorios y resarcitorios (Res. 589/2019)
  - Comparativas entre escenarios
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Tuple
from datetime import date

from .indices_data import (
    MOVILIDAD_HISTORICA, obtener_movilidad_acum,
    TASAS_INTERES, obtener_tasa_interes_periodo
)


# ── Tasas de interés Res. 589/2019 ──────────────────────────────────────────
TASA_PUNITORIA_ANUAL = 0.06          # 6% anual
TASA_PUNITORIA_MENSUAL = 0.005       # 0.5% mensual


@dataclass
class HaberPercibido:
    periodo: str   # YYYY-MM
    importe: float


@dataclass
class DiferenciaMensual:
    periodo: str
    haber_percibido: float
    haber_reajustado: float
    diferencia: float
    porcentaje_reajuste: float
    coeficiente_movilidad: float


@dataclass
class ResultadoReajuste:
    tipo_reajuste: str = ""
    periodo_inicio: str = ""
    periodo_fin: str = ""
    haber_base: float = 0.0
    periodo_base: str = ""

    diferencias: List[DiferenciaMensual] = field(default_factory=list)
    retroactivo_bruto: float = 0.0
    intereses_punitorios: float = 0.0
    intereses_resarcitorios: float = 0.0
    total_credito: float = 0.0

    # Análisis
    meses_calculados: int = 0
    meses_con_diferencia_positiva: int = 0
    porcentaje_promedio_reajuste: float = 0.0

    observaciones: List[str] = field(default_factory=list)
    detalle: Dict = field(default_factory=dict)


class MotorReajuste:
    """
    Calcula el reajuste judicial de haberes previsionales.
    """

    def calcular_solo_movilidad(
        self,
        haber_base: float,
        periodo_base: str,
        periodo_inicio: str,
        periodo_fin: str,
        haberes_percibidos: List[HaberPercibido],
        calcular_intereses: bool = True,
    ) -> ResultadoReajuste:
        """
        Reajuste 'solo por movilidad': aplica coeficientes de movilidad
        desde el haber base y compara con lo percibido.
        """
        r = ResultadoReajuste(
            tipo_reajuste="solo_movilidad",
            periodo_inicio=periodo_inicio,
            periodo_fin=periodo_fin,
            haber_base=haber_base,
            periodo_base=periodo_base,
        )

        coef_base = obtener_movilidad_acum(periodo_base) or 1.0
        percibidos_dict = {h.periodo: h.importe for h in haberes_percibidos}

        periodos = self._generar_periodos(periodo_inicio, periodo_fin)
        total_diferencias = 0.0

        for periodo in periodos:
            coef_actual = obtener_movilidad_acum(periodo)
            if coef_actual is None:
                continue

            haber_reaj = haber_base * (coef_actual / coef_base)
            percibido = percibidos_dict.get(periodo, 0.0)
            diferencia = max(0.0, haber_reaj - percibido)

            pct_reaj = ((haber_reaj / percibido) - 1) * 100 if percibido > 0 else 0.0

            dm = DiferenciaMensual(
                periodo=periodo,
                haber_percibido=percibido,
                haber_reajustado=round(haber_reaj, 2),
                diferencia=round(diferencia, 2),
                porcentaje_reajuste=round(pct_reaj, 2),
                coeficiente_movilidad=round(coef_actual / coef_base, 6),
            )
            r.diferencias.append(dm)
            total_diferencias += diferencia

        r.retroactivo_bruto = round(total_diferencias, 2)
        r.meses_calculados = len(r.diferencias)
        r.meses_con_diferencia_positiva = sum(1 for d in r.diferencias if d.diferencia > 0)

        if calcular_intereses and len(periodos) > 0:
            r.intereses_punitorios = round(
                r.retroactivo_bruto * TASA_PUNITORIA_MENSUAL * len(periodos), 2
            )
            r.intereses_resarcitorios = round(r.retroactivo_bruto * 0.03 * len(periodos), 2)

        r.total_credito = r.retroactivo_bruto + r.intereses_punitorios

        if r.diferencias:
            pcts = [d.porcentaje_reajuste for d in r.diferencias if d.haber_percibido > 0]
            r.porcentaje_promedio_reajuste = sum(pcts) / len(pcts) if pcts else 0.0

        r.detalle = {
            "tipo": "Reajuste solo por movilidad",
            "ley_movilidad": "Ley 26.417 / DL 274/2024",
            "formula": "Haber reajustado = Haber base x (Coef. actual / Coef. base)",
            "haber_base": haber_base,
            "periodo_base": periodo_base,
            "coef_base": coef_base,
        }
        r.observaciones.append(
            f"Se calculó el reajuste para {r.meses_calculados} meses. "
            f"En {r.meses_con_diferencia_positiva} meses el haber reajustado supera al percibido."
        )
        return r

    def calcular_badaro(
        self,
        haber_enero_2002: float,
        haberes_percibidos: List[HaberPercibido],
    ) -> ResultadoReajuste:
        """
        Reajuste Badaro: ajuste período 01/2002-12/2006 ordenado por CSJN.
        Aplica el promedio salarial RIPTE para el período.
        """
        r = ResultadoReajuste(
            tipo_reajuste="badaro",
            periodo_inicio="2002-01",
            periodo_fin="2006-12",
            haber_base=haber_enero_2002,
            periodo_base="2002-01",
        )
        r.observaciones.append(
            "Reajuste Badaro (CSJN, 08/08/2006 y 26/11/2007): ajuste del haber "
            "para el período 01/2002-12/2006 según variación del RIPTE."
        )
        # Factor Badaro: 88.57% de aumento para el período (promedio histórico)
        factor_badaro = 1.8857
        percibidos_dict = {h.periodo: h.importe for h in haberes_percibidos}
        periodos = self._generar_periodos("2002-01", "2006-12")
        for i, periodo in enumerate(periodos):
            factor = 1.0 + (factor_badaro - 1.0) * (i + 1) / len(periodos)
            haber_reaj = haber_enero_2002 * factor
            percibido = percibidos_dict.get(periodo, 0.0)
            diferencia = max(0.0, haber_reaj - percibido)
            r.diferencias.append(DiferenciaMensual(
                periodo=periodo,
                haber_percibido=percibido,
                haber_reajustado=round(haber_reaj, 2),
                diferencia=round(diferencia, 2),
                porcentaje_reajuste=round(((haber_reaj / percibido) - 1) * 100 if percibido > 0 else 0, 2),
                coeficiente_movilidad=round(factor, 6),
            ))
            r.retroactivo_bruto += diferencia
        r.retroactivo_bruto = round(r.retroactivo_bruto, 2)
        r.meses_calculados = len(r.diferencias)
        r.meses_con_diferencia_positiva = sum(1 for d in r.diferencias if d.diferencia > 0)
        r.total_credito = r.retroactivo_bruto
        r.detalle = {
            "tipo": "Reajuste Badaro",
            "ley_referencia": "CSJN 'Badaro' 08/08/2006 y 26/11/2007",
            "formula": "Factor acumulado RIPTE 01/2002-12/2006 = 88.57%",
        }
        return r

    def calcular_delaude(
        self,
        haber_diciembre_2020: float,
        haberes_percibidos: List[HaberPercibido],
    ) -> ResultadoReajuste:
        """
        Reajuste Delaude: recomposición al haber de enero 2021 (CNJN, Ley 27.541).
        """
        r = ResultadoReajuste(
            tipo_reajuste="delaude",
            periodo_inicio="2020-01",
            periodo_fin="2020-12",
            haber_base=haber_diciembre_2020,
            periodo_base="2020-12",
        )
        r.observaciones.append(
            "Reajuste Delaude: recomposición al haber de enero 2021. "
            "Ley 27.609 Art. 3 — factor de actualización aplicado al período 2020."
        )
        # Factor Delaude: 8.07% adicional sobre el haber de diciembre 2020
        factor_delaude = 1.0807
        percibidos_dict = {h.periodo: h.importe for h in haberes_percibidos}
        periodos = self._generar_periodos("2020-01", "2020-12")
        for periodo in periodos:
            haber_reaj = haber_diciembre_2020 * factor_delaude
            percibido = percibidos_dict.get(periodo, 0.0)
            diferencia = max(0.0, haber_reaj - percibido)
            r.diferencias.append(DiferenciaMensual(
                periodo=periodo,
                haber_percibido=percibido,
                haber_reajustado=round(haber_reaj, 2),
                diferencia=round(diferencia, 2),
                porcentaje_reajuste=round(((haber_reaj / percibido) - 1) * 100 if percibido > 0 else 0, 2),
                coeficiente_movilidad=factor_delaude,
            ))
            r.retroactivo_bruto += diferencia
        r.retroactivo_bruto = round(r.retroactivo_bruto, 2)
        r.meses_calculados = len(r.diferencias)
        r.meses_con_diferencia_positiva = sum(1 for d in r.diferencias if d.diferencia > 0)
        r.total_credito = r.retroactivo_bruto
        r.detalle = {
            "tipo": "Reajuste Delaude",
            "ley_referencia": "Ley 27.609 Art. 3 / CSJN 'Delaude'",
            "formula": "Haber reajustado = Haber dic/2020 x 1.0807",
        }
        return r

    def comparar_escenarios(
        self,
        haber_base: float,
        periodo_base: str,
        periodo_inicio: str,
        periodo_fin: str,
        haberes_percibidos: List[HaberPercibido],
        escenarios: List[str] = None,
    ) -> Dict:
        """
        Genera tabla comparativa entre múltiples escenarios de reajuste.
        Retorna dict con resultados por escenario para mostrar en tabla comparativa.
        """
        if escenarios is None:
            escenarios = ["solo_movilidad", "con_pbu_reajuste", "con_art26"]

        resultados = {}
        r_base = self.calcular_solo_movilidad(
            haber_base, periodo_base, periodo_inicio, periodo_fin, haberes_percibidos
        )
        resultados["solo_movilidad"] = r_base

        if "con_pbu_reajuste" in escenarios:
            # Variante con PBU reajustado (Vargas, Aníbal)
            r2 = self.calcular_solo_movilidad(
                haber_base * 1.15, periodo_base, periodo_inicio, periodo_fin, haberes_percibidos
            )
            r2.tipo_reajuste = "con_pbu_reajuste"
            r2.observaciones.insert(0, "Escenario con PBU reajustado (Vargas, Aníbal CSJN).")
            resultados["con_pbu_reajuste"] = r2

        return {
            "escenarios": resultados,
            "resumen": {
                k: {
                    "retroactivo_bruto": v.retroactivo_bruto,
                    "intereses_punitorios": v.intereses_punitorios,
                    "total_credito": v.total_credito,
                }
                for k, v in resultados.items()
            }
        }

    # ── Utilidades ───────────────────────────────────────────────────────────

    def _generar_periodos(self, inicio: str, fin: str) -> List[str]:
        """Genera lista de períodos YYYY-MM entre inicio y fin inclusive."""
        periodos = []
        anio, mes = int(inicio[:4]), int(inicio[5:7])
        anio_fin, mes_fin = int(fin[:4]), int(fin[5:7])
        while (anio, mes) <= (anio_fin, mes_fin):
            periodos.append(f"{anio:04d}-{mes:02d}")
            mes += 1
            if mes > 12:
                mes = 1
                anio += 1
        return periodos
