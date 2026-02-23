"""
Motor de Cálculo del SAC (Sueldo Anual Complementario) Previsional
===================================================================
Ley 23.041 / Art. 122 Ley 24.241:
  Los jubilados y pensionados cobran SAC igual a los trabajadores activos.
  Monto = 50% del mejor haber mensual percibido en el semestre.
  Se paga en dos cuotas:
    • 1er semestre: en Junio (mejor haber Ene–Jun)
    • 2do semestre: en Diciembre (mejor haber Jul–Dic)

Proporcionalidad:
  Si el beneficiario no estuvo activo todo el semestre (alta/baja a mitad),
  el SAC se paga proporcionalmente a los meses en que fue activo.
"""

from dataclasses import dataclass
from typing import List, Optional
from datetime import date


@dataclass
class ResultadoSAC:
    semestre: str             # "1S-2025" | "2S-2025"
    mejor_haber: float
    porcentaje: float         # siempre 0.5 (50%)
    meses_activos: int        # 1-6
    importe_total: float      # mejor_haber × 0.5
    importe_proporcional: float  # × (meses_activos/6)
    importe_final: float      # el que efectivamente se paga
    detalle: dict


class MotorSAC:

    @staticmethod
    def calcular_sac(
        haberes_semestre: List[float],
        semestre: int,             # 1 o 2
        anio: int,
        meses_activos: int = 6,   # cuántos meses estuvo activo en el semestre
        fecha_alta: Optional[date] = None,
        fecha_baja: Optional[date] = None,
    ) -> ResultadoSAC:
        """
        Calcula el SAC para el semestre indicado.

        haberes_semestre: lista de hasta 6 haberes mensuales netos del semestre.
        meses_activos: meses efectivos de goce de la prestación.
        """
        if not haberes_semestre:
            haberes_semestre = [0.0]

        mejor_haber = max(haberes_semestre)
        importe_total = mejor_haber * 0.5

        # Prorrateo si estuvo menos de 6 meses activo
        meses = max(1, min(meses_activos, 6))
        importe_proporcional = importe_total * (meses / 6)
        importe_final = round(importe_proporcional, 2)

        sem_str = f"{'1S' if semestre == 1 else '2S'}-{anio}"

        return ResultadoSAC(
            semestre=sem_str,
            mejor_haber=mejor_haber,
            porcentaje=0.5,
            meses_activos=meses,
            importe_total=importe_total,
            importe_proporcional=importe_proporcional,
            importe_final=importe_final,
            detalle={
                "formula": "SAC = 50% × mejor haber del semestre × (meses_activos/6)",
                "mejor_haber": mejor_haber,
                "meses_activos": meses,
                "proporcional": meses < 6,
                "ley_aplicada": "Ley 23.041 / Art. 122 Ley 24.241",
                "vencimiento_pago": f"{'Junio' if semestre == 1 else 'Diciembre'} {anio}",
            },
        )

    @staticmethod
    def determinar_semestre(periodo: str) -> tuple[int, int]:
        """Dado 'YYYY-MM' retorna (semestre, año): (1, 2025) o (2, 2025)."""
        partes = periodo.split("-")
        anio = int(partes[0])
        mes = int(partes[1])
        return (1 if mes <= 6 else 2, anio)
