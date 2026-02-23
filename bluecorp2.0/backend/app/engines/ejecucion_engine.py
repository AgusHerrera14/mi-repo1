"""
Motor de Ejecución de Sentencias - Blue Corp
=============================================
Módulo 4: Liquidación para ejecución de sentencias judiciales contra ANSES.

Genera la liquidación definitiva conforme a la sentencia:
  - Créditos por diferencias de movilidad
  - Retroactivos con intereses
  - Informe detallado para presentación en juicio
  - Texto de demanda tipo (modelo)
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import date

from .reajuste_engine import MotorReajuste, HaberPercibido, ResultadoReajuste
from .indices_data import obtener_haber_minimo_periodo, obtener_movilidad_acum


@dataclass
class ParametrosSentencia:
    numero_expediente: str
    tribunal: str
    fecha_sentencia: date
    tipo_reajuste: str   # solo_movilidad|badaro|ley_18037|ley_24241|delaude
    haber_base: float
    periodo_base: str
    fecha_inicio_diferencias: str  # YYYY-MM
    fecha_fin_diferencias: str     # YYYY-MM
    tasa_interes: str = "res_589_2019"  # res_589_2019|bna_pasiva|0.5_mensual
    incluye_costas: bool = True
    porcentaje_costas: float = 0.25  # 25%


@dataclass
class LineaLiquidacion:
    periodo: str
    haber_sentencia: float
    haber_percibido: float
    diferencia: float
    interes_calculado: float
    subtotal: float


@dataclass
class ResultadoEjecucion:
    parametros: Optional[ParametrosSentencia] = None
    lineas: List[LineaLiquidacion] = field(default_factory=list)

    subtotal_diferencias: float = 0.0
    subtotal_intereses: float = 0.0
    costas: float = 0.0
    total_credito: float = 0.0

    texto_demanda: str = ""
    observaciones: List[str] = field(default_factory=list)
    detalle: Dict = field(default_factory=dict)


class MotorEjecucion:
    """
    Produce la liquidación de ejecución de sentencia previsional.
    """

    def liquidar_sentencia(
        self,
        params: ParametrosSentencia,
        haberes_percibidos: List[HaberPercibido],
    ) -> ResultadoEjecucion:
        """
        Liquida la ejecución de sentencia según los parámetros.
        """
        res = ResultadoEjecucion(parametros=params)
        motor_reajuste = MotorReajuste()

        # Calcular reajuste según tipo de sentencia
        if params.tipo_reajuste == "solo_movilidad":
            r = motor_reajuste.calcular_solo_movilidad(
                haber_base=params.haber_base,
                periodo_base=params.periodo_base,
                periodo_inicio=params.fecha_inicio_diferencias,
                periodo_fin=params.fecha_fin_diferencias,
                haberes_percibidos=haberes_percibidos,
                calcular_intereses=True,
            )
        elif params.tipo_reajuste == "badaro":
            r = motor_reajuste.calcular_badaro(
                haber_enero_2002=params.haber_base,
                haberes_percibidos=haberes_percibidos,
            )
        elif params.tipo_reajuste == "delaude":
            r = motor_reajuste.calcular_delaude(
                haber_diciembre_2020=params.haber_base,
                haberes_percibidos=haberes_percibidos,
            )
        else:
            # Fallback: solo movilidad
            r = motor_reajuste.calcular_solo_movilidad(
                haber_base=params.haber_base,
                periodo_base=params.periodo_base,
                periodo_inicio=params.fecha_inicio_diferencias,
                periodo_fin=params.fecha_fin_diferencias,
                haberes_percibidos=haberes_percibidos,
            )

        # Construir líneas de liquidación
        for d in r.diferencias:
            linea = LineaLiquidacion(
                periodo=d.periodo,
                haber_sentencia=d.haber_reajustado,
                haber_percibido=d.haber_percibido,
                diferencia=d.diferencia,
                interes_calculado=round(d.diferencia * 0.005, 2),  # 0.5% mensual punitorio
                subtotal=round(d.diferencia * 1.005, 2),
            )
            res.lineas.append(linea)

        res.subtotal_diferencias = r.retroactivo_bruto
        res.subtotal_intereses = r.intereses_punitorios
        res.costas = (
            round(
                (res.subtotal_diferencias + res.subtotal_intereses) * params.porcentaje_costas,
                2,
            )
            if params.incluye_costas
            else 0.0
        )
        res.total_credito = round(
            res.subtotal_diferencias + res.subtotal_intereses + res.costas, 2
        )

        # Generar texto de demanda tipo
        res.texto_demanda = self._generar_texto_demanda(params, res)
        res.detalle = {
            "expediente": params.numero_expediente,
            "tribunal": params.tribunal,
            "fecha_sentencia": str(params.fecha_sentencia),
            "tipo_reajuste": params.tipo_reajuste,
            "meses_liquidados": len(res.lineas),
        }
        return res

    def _generar_texto_demanda(
        self, params: ParametrosSentencia, res: ResultadoEjecucion
    ) -> str:
        hoy = date.today().strftime("%d/%m/%Y")
        tipo_upper = params.tipo_reajuste.upper().replace("_", " ")
        return (
            "LIQUIDACIÓN DE SENTENCIA - EJECUCIÓN PREVISIONAL\n"
            f"Expediente Nro.: {params.numero_expediente}\n"
            f"Tribunal: {params.tribunal}\n"
            f"Fecha de Sentencia: {params.fecha_sentencia}\n"
            "\n"
            f"La parte actora, conforme lo ordenado en la sentencia de fecha "
            f"{params.fecha_sentencia},\n"
            "practica la siguiente liquidación:\n"
            "\n"
            f"PERÍODO LIQUIDADO: {params.fecha_inicio_diferencias} a "
            f"{params.fecha_fin_diferencias}\n"
            f"TIPO DE REAJUSTE: {tipo_upper}\n"
            f"HABER BASE: ${params.haber_base:,.2f} (período {params.periodo_base})\n"
            "\n"
            "CÁLCULO DE DIFERENCIAS:\n"
            f"  - Subtotal diferencias: ${res.subtotal_diferencias:,.2f}\n"
            f"  - Intereses punitorios (Res. 589/2019): ${res.subtotal_intereses:,.2f}\n"
            f"  - Costas ({params.porcentaje_costas * 100:.0f}%): ${res.costas:,.2f}\n"
            f"  - TOTAL CRÉDITO: ${res.total_credito:,.2f}\n"
            "\n"
            "Elaborado con Sistema Blue Corp — www.bluecorp.com.ar\n"
            f"Fecha de liquidación: {hoy}\n"
        )
