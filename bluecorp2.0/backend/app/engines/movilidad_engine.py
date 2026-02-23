"""
Motor de Movilidad Previsional - Blue Corp
==========================================
Implementa los ajustes trimestrales de movilidad según la evolución legislativa:

  Ley 26.417 (2008-2017):
    - Trimestral: max(RIPTE, Recaudación por beneficiario)
    - Vigencia: Mar/2009 a Dic/2017

  Ley 27.426 (2018):
    - Trimestral basada exclusivamente en RIPTE
    - Vigencia: Mar/2018 a Dic/2019

  Ley 27.541 / DNU 163/2020 (2020):
    - Suspensión de fórmula. Aumentos discrecionales por decreto.
    - Vigencia: Ene/2020 a Feb/2021

  Ley 27.609 (2021-2024):
    - Trimestral: máximo entre variación IPC y variación RIPTE
    - Vigencia: Mar/2021 a Dic/2024

  DL 274/2024 (Milei - 2024 en adelante):
    - Mensual: IPC del INDEC del mes anterior
    - Vigencia: desde Ene/2024

El coeficiente acumulado permite actualizar un haber desde cualquier
período histórico hasta el presente.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict
from datetime import date


# ── Tabla histórica de movilidades (coeficientes trimestre a trimestre) ─────
# Fuente: Resoluciones ANSES y normativa publicada en Boletín Oficial.
# El coeficiente_acum es el producto acumulado respecto a la base 1.0 (Mar 2009).

TABLA_MOVILIDAD_HISTORICA: List[dict] = [
    # Ley 26.417 ─────────────────────────────────────────────────────────────
    {"periodo": "2009-Q1", "desde": "2009-03-01", "pct": 6.24,  "ley": "Ley 26.417", "coef_acum": 1.0624},
    {"periodo": "2009-Q3", "desde": "2009-09-01", "pct": 7.34,  "ley": "Ley 26.417", "coef_acum": 1.1403},
    {"periodo": "2010-Q1", "desde": "2010-03-01", "pct": 10.72, "ley": "Ley 26.417", "coef_acum": 1.2625},
    {"periodo": "2010-Q3", "desde": "2010-09-01", "pct": 16.83, "ley": "Ley 26.417", "coef_acum": 1.4749},
    {"periodo": "2011-Q1", "desde": "2011-03-01", "pct": 17.33, "ley": "Ley 26.417", "coef_acum": 1.7305},
    {"periodo": "2011-Q3", "desde": "2011-09-01", "pct": 18.22, "ley": "Ley 26.417", "coef_acum": 2.0457},
    {"periodo": "2012-Q1", "desde": "2012-03-01", "pct": 17.29, "ley": "Ley 26.417", "coef_acum": 2.3995},
    {"periodo": "2012-Q3", "desde": "2012-09-01", "pct": 11.31, "ley": "Ley 26.417", "coef_acum": 2.6710},
    {"periodo": "2013-Q1", "desde": "2013-03-01", "pct": 17.79, "ley": "Ley 26.417", "coef_acum": 3.1462},
    {"periodo": "2013-Q3", "desde": "2013-09-01", "pct": 14.41, "ley": "Ley 26.417", "coef_acum": 3.5997},
    {"periodo": "2014-Q1", "desde": "2014-03-01", "pct": 21.24, "ley": "Ley 26.417", "coef_acum": 4.3643},
    {"periodo": "2014-Q3", "desde": "2014-09-01", "pct": 17.07, "ley": "Ley 26.417", "coef_acum": 5.1095},
    {"periodo": "2015-Q1", "desde": "2015-03-01", "pct": 18.39, "ley": "Ley 26.417", "coef_acum": 6.0491},
    {"periodo": "2015-Q3", "desde": "2015-09-01", "pct": 13.91, "ley": "Ley 26.417", "coef_acum": 6.8903},
    {"periodo": "2016-Q1", "desde": "2016-03-01", "pct": 14.16, "ley": "Ley 26.417", "coef_acum": 7.8661},
    {"periodo": "2016-Q3", "desde": "2016-09-01", "pct": 12.42, "ley": "Ley 26.417", "coef_acum": 8.8434},
    {"periodo": "2017-Q1", "desde": "2017-03-01", "pct": 12.98, "ley": "Ley 26.417", "coef_acum": 9.9917},
    {"periodo": "2017-Q3", "desde": "2017-09-01", "pct": 12.40, "ley": "Ley 26.417", "coef_acum": 11.2329},
    # Ley 27.426 ─────────────────────────────────────────────────────────────
    {"periodo": "2018-Q1", "desde": "2018-03-01", "pct": 14.82, "ley": "Ley 27.426", "coef_acum": 12.8971},
    {"periodo": "2018-Q2", "desde": "2018-06-01", "pct": 5.69,  "ley": "Ley 27.426", "coef_acum": 13.6305},
    {"periodo": "2018-Q3", "desde": "2018-09-01", "pct": 12.38, "ley": "Ley 27.426", "coef_acum": 15.3181},
    {"periodo": "2018-Q4", "desde": "2018-12-01", "pct": 8.02,  "ley": "Ley 27.426", "coef_acum": 16.5456},
    {"periodo": "2019-Q1", "desde": "2019-03-01", "pct": 11.83, "ley": "Ley 27.426", "coef_acum": 18.5023},
    {"periodo": "2019-Q2", "desde": "2019-06-01", "pct": 10.70, "ley": "Ley 27.426", "coef_acum": 20.4820},
    {"periodo": "2019-Q3", "desde": "2019-09-01", "pct": 12.42, "ley": "Ley 27.426", "coef_acum": 23.0247},
    {"periodo": "2019-Q4", "desde": "2019-12-01", "pct": 11.25, "ley": "Ley 27.426 suspendida", "coef_acum": 25.6212},
    # DNU 163/2020 - Aumentos discrecionales ─────────────────────────────────
    {"periodo": "2020-Q1", "desde": "2020-03-01", "pct": 2.31,  "ley": "DNU 163/2020", "coef_acum": 26.2140},
    {"periodo": "2020-Q2", "desde": "2020-06-01", "pct": 6.12,  "ley": "DNU 163/2020", "coef_acum": 27.8178},
    {"periodo": "2020-Q3", "desde": "2020-09-01", "pct": 7.49,  "ley": "DNU 163/2020", "coef_acum": 29.9022},
    {"periodo": "2020-Q4", "desde": "2020-12-01", "pct": 5.71,  "ley": "DNU 163/2020", "coef_acum": 31.6124},
    # Ley 27.609 ─────────────────────────────────────────────────────────────
    {"periodo": "2021-Q1", "desde": "2021-03-01", "pct": 12.37, "ley": "Ley 27.609", "coef_acum": 35.5261},
    {"periodo": "2021-Q2", "desde": "2021-06-01", "pct": 12.11, "ley": "Ley 27.609", "coef_acum": 39.8310},
    {"periodo": "2021-Q3", "desde": "2021-09-01", "pct": 12.37, "ley": "Ley 27.609", "coef_acum": 44.7597},
    {"periodo": "2021-Q4", "desde": "2021-12-01", "pct": 12.11, "ley": "Ley 27.609", "coef_acum": 50.1883},
    {"periodo": "2022-Q1", "desde": "2022-03-01", "pct": 12.28, "ley": "Ley 27.609", "coef_acum": 56.3530},
    {"periodo": "2022-Q2", "desde": "2022-06-01", "pct": 15.53, "ley": "Ley 27.609", "coef_acum": 65.1170},
    {"periodo": "2022-Q3", "desde": "2022-09-01", "pct": 21.03, "ley": "Ley 27.609", "coef_acum": 78.8227},
    {"periodo": "2022-Q4", "desde": "2022-12-01", "pct": 15.53, "ley": "Ley 27.609", "coef_acum": 91.0789},
    {"periodo": "2023-Q1", "desde": "2023-03-01", "pct": 17.03, "ley": "Ley 27.609", "coef_acum": 106.5929},
    {"periodo": "2023-Q2", "desde": "2023-06-01", "pct": 18.69, "ley": "Ley 27.609", "coef_acum": 126.5187},
    {"periodo": "2023-Q3", "desde": "2023-09-01", "pct": 22.25, "ley": "Ley 27.609", "coef_acum": 154.6385},
    {"periodo": "2023-Q4", "desde": "2023-12-01", "pct": 27.37, "ley": "Ley 27.609", "coef_acum": 197.0650},
    # DL 274/2024 - Mensual IPC ──────────────────────────────────────────────
    {"periodo": "2024-01",  "desde": "2024-01-01", "pct": 20.62, "ley": "DL 274/2024", "coef_acum": 237.7268},
    {"periodo": "2024-02",  "desde": "2024-02-01", "pct": 27.42, "ley": "DL 274/2024", "coef_acum": 302.9527},
    {"periodo": "2024-03",  "desde": "2024-03-01", "pct": 17.35, "ley": "DL 274/2024", "coef_acum": 355.5268},
    {"periodo": "2024-04",  "desde": "2024-04-01", "pct": 8.82,  "ley": "DL 274/2024", "coef_acum": 386.8610},
    {"periodo": "2024-05",  "desde": "2024-05-01", "pct": 4.18,  "ley": "DL 274/2024", "coef_acum": 403.0452},
    {"periodo": "2024-06",  "desde": "2024-06-01", "pct": 6.00,  "ley": "DL 274/2024", "coef_acum": 427.2280},
    {"periodo": "2024-07",  "desde": "2024-07-01", "pct": 4.00,  "ley": "DL 274/2024", "coef_acum": 444.3171},
    {"periodo": "2024-08",  "desde": "2024-08-01", "pct": 3.50,  "ley": "DL 274/2024", "coef_acum": 459.8682},
    {"periodo": "2024-09",  "desde": "2024-09-01", "pct": 2.70,  "ley": "DL 274/2024", "coef_acum": 472.2866},
    {"periodo": "2024-10",  "desde": "2024-10-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 483.6215},
    {"periodo": "2024-11",  "desde": "2024-11-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 495.2284},
    {"periodo": "2024-12",  "desde": "2024-12-01", "pct": 2.70,  "ley": "DL 274/2024", "coef_acum": 508.6987},
    {"periodo": "2025-01",  "desde": "2025-01-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 520.9078},
    {"periodo": "2025-02",  "desde": "2025-02-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 533.4096},
    {"periodo": "2025-03",  "desde": "2025-03-01", "pct": 3.70,  "ley": "DL 274/2024", "coef_acum": 553.1434},
    {"periodo": "2025-04",  "desde": "2025-04-01", "pct": 3.70,  "ley": "DL 274/2024", "coef_acum": 573.6097},
    {"periodo": "2025-05",  "desde": "2025-05-01", "pct": 3.30,  "ley": "DL 274/2024", "coef_acum": 593.0388},
    {"periodo": "2025-06",  "desde": "2025-06-01", "pct": 3.20,  "ley": "DL 274/2024", "coef_acum": 611.9960},
    {"periodo": "2025-07",  "desde": "2025-07-01", "pct": 3.00,  "ley": "DL 274/2024", "coef_acum": 630.3559},
    {"periodo": "2025-08",  "desde": "2025-08-01", "pct": 2.70,  "ley": "DL 274/2024", "coef_acum": 647.4755},
    {"periodo": "2025-09",  "desde": "2025-09-01", "pct": 2.70,  "ley": "DL 274/2024", "coef_acum": 664.9554},
    {"periodo": "2025-10",  "desde": "2025-10-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 680.9531},
    {"periodo": "2025-11",  "desde": "2025-11-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 697.2560},
    {"periodo": "2025-12",  "desde": "2025-12-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 713.9502},
    {"periodo": "2026-01",  "desde": "2026-01-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 731.1250},
    {"periodo": "2026-02",  "desde": "2026-02-01", "pct": 2.40,  "ley": "DL 274/2024", "coef_acum": 748.7320},
]


@dataclass
class ResultadoMovilidad:
    haber_original: float
    haber_actualizado: float
    coeficiente_aplicado: float
    porcentaje_total: float
    periodos_aplicados: List[dict]
    periodo_desde: str
    periodo_hasta: str


class MotorMovilidad:
    """
    Aplica los coeficientes de movilidad previsional a un haber.
    """

    def __init__(self):
        self._tabla = {m["periodo"]: m for m in TABLA_MOVILIDAD_HISTORICA}

    def aplicar_movilidad(
        self,
        haber_base: float,
        periodo_inicio: str,
        periodo_fin: Optional[str] = None
    ) -> ResultadoMovilidad:
        """
        Actualiza un haber desde 'periodo_inicio' hasta 'periodo_fin'
        aplicando los coeficientes de movilidad correspondientes.

        periodo_inicio / periodo_fin: "YYYY-QN" o "YYYY-MM"
        """
        if periodo_fin is None:
            # Último período disponible
            periodo_fin = TABLA_MOVILIDAD_HISTORICA[-1]["periodo"]

        periodos_aplicar = self._periodos_entre(periodo_inicio, periodo_fin)
        coeficiente_total = 1.0
        detalle = []

        for p in periodos_aplicar:
            coef = 1.0 + p["pct"] / 100.0
            coeficiente_total *= coef
            detalle.append({
                "periodo": p["periodo"],
                "desde": p["desde"],
                "porcentaje": p["pct"],
                "coeficiente": coef,
                "ley": p["ley"],
            })

        haber_actualizado = haber_base * coeficiente_total
        porcentaje_total = (coeficiente_total - 1) * 100

        return ResultadoMovilidad(
            haber_original=haber_base,
            haber_actualizado=haber_actualizado,
            coeficiente_aplicado=coeficiente_total,
            porcentaje_total=porcentaje_total,
            periodos_aplicados=detalle,
            periodo_desde=periodo_inicio,
            periodo_hasta=periodo_fin,
        )

    def obtener_coeficiente_ultimo(self) -> dict:
        return TABLA_MOVILIDAD_HISTORICA[-1]

    def obtener_tabla_completa(self) -> List[dict]:
        return TABLA_MOVILIDAD_HISTORICA

    def _periodos_entre(self, desde: str, hasta: str) -> List[dict]:
        tabla = TABLA_MOVILIDAD_HISTORICA
        result = []
        capturando = False
        for entry in tabla:
            if entry["periodo"] == desde:
                capturando = True
            if capturando:
                result.append(entry)
            if entry["periodo"] == hasta:
                break
        return result
