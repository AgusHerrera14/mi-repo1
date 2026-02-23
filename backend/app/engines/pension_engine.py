"""
Motor de Cálculo Previsional - Blue Corp
=========================================
Implementa los cálculos del Sistema Integrado Previsional Argentino (SIPA)
según la Ley 24.241 y sus modificaciones.

Prestaciones calculadas:
  - PBU: Prestación Básica Universal (Art. 19-21)
  - PC:  Prestación Compensatoria (Art. 23-25) - servicios pre-SIJP (antes 07/1994)
  - PAP: Prestación Adicional por Permanencia (Art. 30-31) - servicios post-SIJP
  - Haber Mínimo Garantizado
  - Retiro por Invalidez
  - Pensión por Fallecimiento

Fórmulas legales:
  PBU = 2.5 × Haber Mínimo Vigente  (piso garantizado)
  PC  = 1.5% × años_pre_SIJP × PBCI  (donde PBCI es el promedio de las mejores
        remuneraciones indexadas de los últimos 10 años o los mejores 120 meses
        de los últimos 180 meses según el caso)
  PAP = 0.85% × años_post_SIJP × PBCI
  Haber = PBU + PC + PAP  (mínimo: Haber Mínimo Garantizado)
"""

from dataclasses import dataclass, field
from typing import List, Optional
from datetime import date, datetime
from app.core.config import settings


@dataclass
class PeriodoLaboral:
    fecha_inicio: date
    fecha_fin: Optional[date]
    tipo: str = "dependencia"


@dataclass
class Remuneracion:
    periodo: str   # YYYY-MM
    importe: float


@dataclass
class ResultadoCalculo:
    pbu: float = 0.0
    pc: float = 0.0
    pap: float = 0.0
    haber_bruto: float = 0.0
    haber_minimo_garantizado: float = 0.0
    haber_final: float = 0.0

    anios_reconocidos_pre_sijp: float = 0.0
    anios_reconocidos_post_sijp: float = 0.0
    anios_totales: float = 0.0

    pbci: float = 0.0          # Promedio Base de Cálculo Indexado
    remuneraciones_base: List[float] = field(default_factory=list)

    cumple_edad: bool = False
    cumple_aportes: bool = False
    tiene_derecho: bool = False

    observaciones: List[str] = field(default_factory=list)
    detalle_calculo: dict = field(default_factory=dict)


class MotorCalculoPension:
    """
    Motor principal de cálculo previsional argentino.
    Ley 24.241 (SIPA) y modificaciones.
    """

    # Fecha de inicio del SIJP (Sistema Integrado de Jubilaciones y Pensiones)
    FECHA_CORTE_SIJP = date(1994, 7, 1)

    def __init__(self, haber_minimo: float = None):
        self.haber_minimo = haber_minimo or settings.HABER_MINIMO_VIGENTE
        self.haber_maximo = settings.HABER_MAXIMO_VIGENTE

    def calcular_jubilacion_ordinaria(
        self,
        fecha_nacimiento: date,
        sexo: str,
        periodos_laborales: List[PeriodoLaboral],
        remuneraciones: List[Remuneracion],
        fecha_calculo: Optional[date] = None
    ) -> ResultadoCalculo:
        """
        Calcula la jubilación ordinaria (Art. 19, Ley 24.241).
        Requisitos: 30 años de aportes + edad mínima (65H / 60M).
        """
        resultado = ResultadoCalculo()
        fecha_calculo = fecha_calculo or date.today()

        # 1. Verificar edad
        edad = self._calcular_edad(fecha_nacimiento, fecha_calculo)
        edad_minima = (
            settings.EDAD_JUBILACION_HOMBRE
            if sexo.upper() == "M"
            else settings.EDAD_JUBILACION_MUJER
        )
        resultado.cumple_edad = edad >= edad_minima

        # 2. Calcular años de aportes por período
        anios_pre, anios_post = self._calcular_anios_aportes(periodos_laborales)
        resultado.anios_reconocidos_pre_sijp = anios_pre
        resultado.anios_reconocidos_post_sijp = anios_post
        resultado.anios_totales = anios_pre + anios_post
        resultado.cumple_aportes = resultado.anios_totales >= settings.ANIOS_MIN_APORTES

        resultado.tiene_derecho = resultado.cumple_edad and resultado.cumple_aportes

        if not resultado.cumple_edad:
            resultado.observaciones.append(
                f"No cumple la edad mínima ({edad_minima} años). Edad actual: {edad:.1f} años."
            )
        if not resultado.cumple_aportes:
            resultado.observaciones.append(
                f"No cumple los 30 años de aportes mínimos. Años reconocidos: {resultado.anios_totales:.2f}."
            )

        # 3. Calcular PBCI (Promedio Base de Cálculo Indexado)
        resultado.pbci = self._calcular_pbci(remuneraciones)
        resultado.remuneraciones_base = [r.importe for r in remuneraciones[:10]]

        # 4. Calcular PBU
        resultado.pbu = self._calcular_pbu()

        # 5. Calcular PC (servicios pre-SIJP)
        resultado.pc = self._calcular_pc(anios_pre, resultado.pbci)

        # 6. Calcular PAP (servicios post-SIJP)
        resultado.pap = self._calcular_pap(anios_post, resultado.pbci)

        # 7. Haber bruto
        resultado.haber_bruto = resultado.pbu + resultado.pc + resultado.pap

        # 8. Haber mínimo garantizado
        resultado.haber_minimo_garantizado = self.haber_minimo

        # 9. Aplicar tope mínimo y máximo
        resultado.haber_final = max(resultado.haber_bruto, resultado.haber_minimo_garantizado)
        resultado.haber_final = min(resultado.haber_final, self.haber_maximo)

        # 10. Detalle del cálculo
        resultado.detalle_calculo = {
            "formula": "Haber = PBU + PC + PAP",
            "pbu_formula": f"PBU = 2.5 × Haber Mínimo = 2.5 × {self.haber_minimo:,.2f} ARS",
            "pc_formula": f"PC = 1.5% × {anios_pre:.2f} años × {resultado.pbci:,.2f} PBCI",
            "pap_formula": f"PAP = 0.85% × {anios_post:.2f} años × {resultado.pbci:,.2f} PBCI",
            "haber_bruto": resultado.haber_bruto,
            "haber_minimo_aplicado": resultado.haber_final == resultado.haber_minimo_garantizado,
            "edad_calculada": round(edad, 2),
            "edad_minima_requerida": edad_minima,
            "ley_aplicada": "Ley 24.241 SIPA + modificatorias",
        }

        return resultado

    def calcular_retiro_invalidez(
        self,
        fecha_nacimiento: date,
        sexo: str,
        periodos_laborales: List[PeriodoLaboral],
        remuneraciones: List[Remuneracion],
        porcentaje_incapacidad: float,
        fecha_calculo: Optional[date] = None
    ) -> ResultadoCalculo:
        """
        Calcula el Retiro por Invalidez (Art. 48-53, Ley 24.241).
        Requisito: incapacidad ≥ 66%, sin requisito de edad.
        Haber = 70% del promedio de remuneraciones (últimos 5 años) + cargas de familia.
        """
        resultado = ResultadoCalculo()
        fecha_calculo = fecha_calculo or date.today()

        if porcentaje_incapacidad < 66.0:
            resultado.observaciones.append(
                f"La incapacidad ({porcentaje_incapacidad}%) debe ser igual o mayor al 66% para acceder al Retiro por Invalidez."
            )
            return resultado

        resultado.tiene_derecho = True

        # Promedio de últimas remuneraciones (hasta 60 meses)
        rems_ordenadas = sorted(remuneraciones, key=lambda r: r.periodo, reverse=True)
        rems_base = rems_ordenadas[:60]
        promedio = sum(r.importe for r in rems_base) / max(len(rems_base), 1)
        resultado.pbci = promedio

        # Haber = 70% del promedio
        haber_calculado = promedio * 0.70

        resultado.pbu = haber_calculado  # Se usa PBU para almacenar el haber base
        resultado.haber_bruto = haber_calculado
        resultado.haber_minimo_garantizado = self.haber_minimo * 0.70
        resultado.haber_final = max(haber_calculado, resultado.haber_minimo_garantizado)

        anios_pre, anios_post = self._calcular_anios_aportes(periodos_laborales)
        resultado.anios_reconocidos_pre_sijp = anios_pre
        resultado.anios_reconocidos_post_sijp = anios_post
        resultado.anios_totales = anios_pre + anios_post

        resultado.detalle_calculo = {
            "formula": "Retiro = 70% × Promedio Remuneraciones (60 meses)",
            "promedio_remuneraciones": promedio,
            "porcentaje_incapacidad": porcentaje_incapacidad,
            "haber_calculado": haber_calculado,
            "ley_aplicada": "Art. 48-53, Ley 24.241",
        }
        return resultado

    def calcular_pension_fallecimiento(
        self,
        haber_causante: float,
        cantidad_convivientes: int = 1,
        cantidad_hijos: int = 0,
    ) -> dict:
        """
        Calcula la Pensión por Fallecimiento (Art. 53-68, Ley 24.241).
        El cónyuge/conviviente recibe el 70% del haber del causante.
        Cada hijo menor recibe una porción adicional.
        """
        # Porcentajes base (Art. 98, Ley 24.241)
        porcentaje_conyuge = 0.70
        porcentaje_hijo = 0.20  # cada hijo hasta 18 años (o sin límite si discapacitado)

        pension_conyuge = haber_causante * porcentaje_conyuge
        pension_hijos = haber_causante * porcentaje_hijo * cantidad_hijos

        return {
            "haber_causante": haber_causante,
            "pension_conyuge_conviviente": pension_conyuge,
            "pension_por_hijo": haber_causante * porcentaje_hijo,
            "cantidad_hijos": cantidad_hijos,
            "total_hijos": pension_hijos,
            "total_pension": pension_conyuge + pension_hijos,
            "ley_aplicada": "Art. 53-68, Ley 24.241",
        }

    # ── Métodos privados de cálculo ──────────────────────────────────────────

    def _calcular_edad(self, fecha_nacimiento: date, fecha_referencia: date) -> float:
        delta = fecha_referencia - fecha_nacimiento
        return delta.days / 365.25

    def _calcular_anios_aportes(
        self, periodos: List[PeriodoLaboral]
    ) -> tuple[float, float]:
        """
        Separa los períodos de aportes en pre-SIJP (antes 01/07/1994)
        y post-SIJP (desde 01/07/1994).
        Retorna (años_pre, años_post).
        """
        dias_pre = 0
        dias_post = 0

        for p in periodos:
            inicio = p.fecha_inicio
            fin = p.fecha_fin or date.today()

            # Parte pre-SIJP
            if inicio < self.FECHA_CORTE_SIJP:
                fin_pre = min(fin, self.FECHA_CORTE_SIJP)
                dias_pre += max(0, (fin_pre - inicio).days)

            # Parte post-SIJP
            if fin > self.FECHA_CORTE_SIJP:
                inicio_post = max(inicio, self.FECHA_CORTE_SIJP)
                dias_post += max(0, (fin - inicio_post).days)

        return dias_pre / 365.25, dias_post / 365.25

    def _calcular_pbci(self, remuneraciones: List[Remuneracion]) -> float:
        """
        PBCI: Promedio Base de Cálculo Indexado.
        Según Art. 24 y 30 Ley 24.241: promedio de las mejores remuneraciones
        de los últimos 10 años (hasta 120 meses), o los mejores 120 de los
        últimos 180 meses.
        En la práctica actual: se usan todas las remuneraciones disponibles.
        """
        if not remuneraciones:
            return 0.0
        importes = sorted([r.importe for r in remuneraciones], reverse=True)
        # Tomar las mejores hasta 120 meses
        mejores = importes[:120]
        return sum(mejores) / len(mejores)

    def _calcular_pbu(self) -> float:
        """
        PBU: Prestación Básica Universal (Art. 19-21, Ley 24.241).
        Monto fijo actualizado trimestralmente = 2.5 × Haber Mínimo.
        """
        return 2.5 * self.haber_minimo

    def _calcular_pc(self, anios_pre_sijp: float, pbci: float) -> float:
        """
        PC: Prestación Compensatoria (Art. 23-25, Ley 24.241).
        PC = 1.5% × años_pre_SIJP × PBCI
        Tope: 35 años.
        """
        anios_efectivos = min(anios_pre_sijp, 35.0)
        return settings.TASA_PC * anios_efectivos * pbci

    def _calcular_pap(self, anios_post_sijp: float, pbci: float) -> float:
        """
        PAP: Prestación Adicional por Permanencia (Art. 30-31, Ley 24.241).
        PAP = 0.85% × años_post_SIJP × PBCI
        """
        return settings.TASA_PAP * anios_post_sijp * pbci
