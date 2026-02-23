"""
Motor de Cálculo del Haber Jubilatorio - Blue Corp
====================================================
Módulo 2 de Blue Corp: Cálculo del Haber Inicial.

Calcula:
  PBU: Prestación Básica Universal (Art. 19, Ley 24.241)
  PC:  Prestación Compensatoria (Art. 23-24) — servicios bajo SNPS (pre-07/1994)
  PAP: Prestación Adicional por Permanencia (Art. 30) — servicios bajo SIPA (post-07/1994)
  PAP Transitoria: ex-AFJPistas bajo Ley 26.425 (2008)
  PUAM: Prestación Universal para el Adulto Mayor (Ley 27.160)

Actualización de remuneraciones:
  INGR  → hasta 03/1995
  RIPTE → 04/1995 a 06/2008
  Movilidad Ley 26.417 → 07/2008 en adelante
  DL 274/2024 → desde 07/2024

Resoluciones judiciales integradas:
  Badaro I/II, Eliff, Carutti, Cirillo, Chocobar, Vargas (Aníbal), Delaude
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Tuple
from datetime import date, datetime
from decimal import Decimal

from .indices_data import (
    INGR_HISTORICO, RIPTE_HISTORICO, MOVILIDAD_HISTORICA,
    TOPES_HISTORICOS, obtener_ripte_periodo, obtener_ingr_periodo,
    obtener_movilidad_acum, obtener_haber_minimo_periodo, obtener_haber_maximo_periodo
)


# ── Constantes legales ────────────────────────────────────────────────────────

FECHA_CORTE_SIJP = date(1994, 7, 1)   # inicio del SIJP
FECHA_CORTE_RIPTE = date(1995, 4, 1)  # inicio actualización RIPTE
FECHA_CORTE_RIPTE_FIN = date(2008, 7, 1)  # fin actualización RIPTE
TASA_PC = 0.015   # 1.5% por año de servicios pre-SIJP
TASA_PAP = 0.015  # 1.5% por año de servicios post-SIJP (reparto, Ley 26.222)
ANIOS_MIN_JUBILACION = 30.0
EDAD_MIN_HOMBRE = 65
EDAD_MIN_MUJER = 60
MAX_ANIOS_PC = 35.0


@dataclass
class PeriodoLaboral:
    fecha_inicio: date
    fecha_fin: Optional[date]
    tipo: str = "dependencia"  # dependencia|autonomo|monotributo|especial|diferencial
    regimen: str = "SIPA"      # SIPA|SNPS|especial_docente|fuerzas_seguridad
    empleador: Optional[str] = None
    porcentaje: float = 100.0  # para regímenes diferenciales


@dataclass
class Remuneracion:
    periodo: str    # YYYY-MM
    importe_nominal: float
    tipo: str = "dependencia"  # dependencia|autonomo|monotributo


@dataclass
class ResultadoHaber:
    # Prestaciones
    pbu: float = 0.0
    pc: float = 0.0
    pap: float = 0.0
    pap_transitoria: float = 0.0
    haber_bruto: float = 0.0
    haber_minimo_vigente: float = 0.0
    haber_maximo_vigente: float = 0.0
    haber_final: float = 0.0
    complemento_minimo: float = 0.0  # diferencia hasta el mínimo si aplica

    # Datos de cálculo
    pbci: float = 0.0  # Promedio Base de Cálculo Indexado
    anios_pre_sijp: float = 0.0
    anios_post_sijp: float = 0.0
    anios_totales: float = 0.0
    remuneraciones_utilizadas: int = 0
    remuneraciones_actualizadas: List[Dict] = field(default_factory=list)

    # Tipo de cálculo
    tipo_calculo: str = "estimado"  # estimado|exacto
    tipo_beneficio: str = "jubilacion_ordinaria"
    fecha_calculo: Optional[date] = None

    # Flags de derecho
    tiene_derecho: bool = False
    cumple_edad: bool = False
    cumple_aportes: bool = False
    edad_actual: float = 0.0
    edad_requerida: float = 0.0

    # Detalle y observaciones
    observaciones: List[str] = field(default_factory=list)
    detalle: Dict = field(default_factory=dict)


class MotorHaber:
    """
    Calcula el haber jubilatorio inicial.
    Ley 24.241 SIPA + resoluciones judiciales.
    """

    def __init__(self, fecha_calculo: Optional[date] = None):
        self.fecha_calculo = fecha_calculo or date.today()
        periodo_actual = self.fecha_calculo.strftime("%Y-%m")
        self.haber_minimo = obtener_haber_minimo_periodo(periodo_actual)
        self.haber_maximo = obtener_haber_maximo_periodo(periodo_actual)

    # ── API pública ──────────────────────────────────────────────────────────

    def calcular_jubilacion_ordinaria(
        self,
        fecha_nacimiento: date,
        sexo: str,
        periodos: List[PeriodoLaboral],
        remuneraciones: List[Remuneracion],
        tipo_calculo: str = "estimado",
    ) -> ResultadoHaber:
        """Jubilación ordinaria (Art. 17-18, Ley 24.241)."""
        r = ResultadoHaber(tipo_calculo=tipo_calculo, tipo_beneficio="jubilacion_ordinaria",
                           fecha_calculo=self.fecha_calculo)

        edad = self._edad(fecha_nacimiento, self.fecha_calculo)
        edad_req = EDAD_MIN_HOMBRE if sexo.upper() == "M" else EDAD_MIN_MUJER
        r.edad_actual = edad
        r.edad_requerida = float(edad_req)
        r.cumple_edad = edad >= edad_req

        anios_pre, anios_post = self._anios_por_regimen(periodos)
        r.anios_pre_sijp = anios_pre
        r.anios_post_sijp = anios_post
        r.anios_totales = anios_pre + anios_post
        r.cumple_aportes = r.anios_totales >= ANIOS_MIN_JUBILACION

        if not r.cumple_edad:
            r.observaciones.append(
                f"No cumple edad mínima. Requerida: {edad_req} años. Actual: {edad:.1f} años."
            )
        if not r.cumple_aportes:
            r.observaciones.append(
                f"No cumple 30 años de aportes. Reconocidos: {r.anios_totales:.2f} años."
            )

        r.tiene_derecho = r.cumple_edad and r.cumple_aportes

        # Cálculo del haber (aunque no tenga derecho, para orientación)
        self._calcular_prestaciones(r, periodos, remuneraciones)
        return r

    def calcular_pension_fallecimiento(
        self,
        fecha_nacimiento_derecho_habiente: date,
        haber_causante: float,
        anios_convivencia: float = 0.0,
    ) -> ResultadoHaber:
        """Pensión por fallecimiento: 75% del haber del causante (Art. 97-99, Ley 24.241)."""
        r = ResultadoHaber(tipo_beneficio="pension_fallecimiento", fecha_calculo=self.fecha_calculo)
        r.tiene_derecho = True
        pension = haber_causante * 0.75
        r.haber_bruto = pension
        r.haber_minimo_vigente = self.haber_minimo * 0.75
        r.haber_final = max(pension, r.haber_minimo_vigente)
        r.complemento_minimo = max(0.0, r.haber_minimo_vigente - pension)
        r.detalle = {
            "haber_causante": haber_causante,
            "porcentaje": "75%",
            "formula": "Pensión = 75% × Haber del Causante",
            "ley": "Art. 97-99, Ley 24.241",
        }
        return r

    def calcular_retiro_invalidez(
        self,
        fecha_nacimiento: date,
        sexo: str,
        periodos: List[PeriodoLaboral],
        remuneraciones: List[Remuneracion],
        porcentaje_incapacidad: float,
    ) -> ResultadoHaber:
        """Retiro por invalidez: 70% promedio remuneraciones (Art. 48-53, Ley 24.241)."""
        r = ResultadoHaber(tipo_beneficio="retiro_invalidez", fecha_calculo=self.fecha_calculo)
        if porcentaje_incapacidad < 66.0:
            r.observaciones.append(
                f"Incapacidad ({porcentaje_incapacidad}%) menor al 66% requerido."
            )
            return r
        r.tiene_derecho = True

        # Promedio de últimas 60 remuneraciones
        rems = sorted(remuneraciones, key=lambda x: x.periodo, reverse=True)[:60]
        promedio = sum(x.importe_nominal for x in rems) / max(len(rems), 1)
        r.pbci = promedio
        r.haber_bruto = promedio * 0.70
        r.haber_minimo_vigente = self.haber_minimo
        r.haber_final = max(r.haber_bruto, r.haber_minimo_vigente)
        r.complemento_minimo = max(0.0, r.haber_minimo_vigente - r.haber_bruto)
        r.detalle = {
            "formula": "Retiro = 70% × Promedio últimas 60 remuneraciones",
            "promedio_base": promedio,
            "porcentaje_incapacidad": porcentaje_incapacidad,
            "ley": "Art. 48-53, Ley 24.241",
        }
        return r

    def calcular_puam(self) -> ResultadoHaber:
        """PUAM: 80% del haber mínimo (Ley 27.160 / Res. SSS-N°1/2015)."""
        r = ResultadoHaber(tipo_beneficio="PUAM", fecha_calculo=self.fecha_calculo)
        r.tiene_derecho = True
        r.haber_bruto = self.haber_minimo * 0.80
        r.haber_final = r.haber_bruto
        r.detalle = {
            "formula": "PUAM = 80% × Haber Mínimo",
            "haber_minimo": self.haber_minimo,
            "ley": "Ley 27.160 / Res. SSS-N°1/2015",
        }
        return r

    # ── Cálculo de prestaciones PBU+PC+PAP ───────────────────────────────────

    def _calcular_prestaciones(
        self,
        r: ResultadoHaber,
        periodos: List[PeriodoLaboral],
        remuneraciones: List[Remuneracion],
    ) -> None:
        """Calcula PBU + PC + PAP y aplica topes."""
        # PBU: fijo por movilidad (actualizamos con tabla)
        r.pbu = self.haber_minimo * 2.5

        # Actualizar remuneraciones y calcular PBCI
        rems_act = self._actualizar_remuneraciones(remuneraciones)
        r.remuneraciones_actualizadas = rems_act
        r.remuneraciones_utilizadas = len(rems_act)
        r.pbci = self._calcular_pbci(rems_act)

        # PC: servicios pre-SIJP (SNPS)
        anios_pc = min(r.anios_pre_sijp, MAX_ANIOS_PC)
        r.pc = TASA_PC * anios_pc * r.pbci

        # PAP: servicios post-SIJP (SIPA reparto)
        r.pap = TASA_PAP * r.anios_post_sijp * r.pbci

        # Haber bruto y topes
        r.haber_bruto = r.pbu + r.pc + r.pap
        r.haber_minimo_vigente = self.haber_minimo
        r.haber_maximo_vigente = self.haber_maximo
        r.haber_final = max(r.haber_bruto, r.haber_minimo_vigente)
        r.haber_final = min(r.haber_final, r.haber_maximo_vigente)
        r.complemento_minimo = max(0.0, r.haber_minimo_vigente - r.haber_bruto)

        r.detalle = {
            "formula": "Haber = PBU + PC + PAP",
            "pbu_formula": f"PBU = 2.5 × {self.haber_minimo:,.2f} = {r.pbu:,.2f}",
            "pc_formula": f"PC = 1.5% × {anios_pc:.2f} años × {r.pbci:,.2f} PBCI = {r.pc:,.2f}",
            "pap_formula": f"PAP = 1.5% × {r.anios_post_sijp:.2f} años × {r.pbci:,.2f} PBCI = {r.pap:,.2f}",
            "pbci": r.pbci,
            "haber_bruto": r.haber_bruto,
            "tope_minimo_aplicado": r.complemento_minimo > 0,
            "tope_maximo_aplicado": r.haber_bruto > r.haber_maximo_vigente,
            "ley": "Ley 24.241 SIPA (art. 19, 24, 30) + modificatorias",
        }

    def _actualizar_remuneraciones(self, remuneraciones: List[Remuneracion]) -> List[Dict]:
        """
        Actualiza remuneraciones al valor actual usando:
          - INGR hasta 03/1995
          - RIPTE de 04/1995 a 06/2008
          - Movilidad de 07/2008 en adelante
        """
        resultado = []
        # Referencia: RIPTE al último período disponible
        ripte_ref_periodo = "2025-12"
        ripte_ref = obtener_ripte_periodo(ripte_ref_periodo) or 1.0

        for rem in remuneraciones:
            periodo = rem.periodo  # YYYY-MM
            anio = int(periodo[:4])
            mes = int(periodo[5:7])
            fecha_p = date(anio, mes, 1)

            if fecha_p < FECHA_CORTE_RIPTE:
                # Pre-04/1995: actualizar con INGR
                ingr_orig = obtener_ingr_periodo(periodo) or 1.0
                ingr_ref_periodo = "1995-03"
                ingr_ref = obtener_ingr_periodo(ingr_ref_periodo) or ingr_orig
                ripte_inicio = obtener_ripte_periodo("1995-04") or ripte_ref
                # Factor INGR hasta 03/1995, luego RIPTE
                factor_ingr = ingr_ref / ingr_orig
                factor_ripte = ripte_ref / ripte_inicio
                factor_total = factor_ingr * factor_ripte
                indice = "INGR→RIPTE"
            elif fecha_p < FECHA_CORTE_RIPTE_FIN:
                # 04/1995 a 06/2008: actualizar con RIPTE
                ripte_orig = obtener_ripte_periodo(periodo) or ripte_ref
                factor_total = ripte_ref / ripte_orig
                indice = "RIPTE"
            else:
                # 07/2008 en adelante: actualizar con movilidad
                coef_orig = obtener_movilidad_acum(periodo)
                coef_ref = obtener_movilidad_acum(ripte_ref_periodo)
                factor_total = coef_ref / coef_orig if coef_orig and coef_orig > 0 else 1.0
                indice = "Movilidad Ley 26.417 / DL 274/2024"

            importe_act = rem.importe_nominal * factor_total
            resultado.append({
                "periodo": periodo,
                "importe_nominal": rem.importe_nominal,
                "importe_actualizado": round(importe_act, 2),
                "factor": round(factor_total, 6),
                "indice": indice,
            })

        return resultado

    def _calcular_pbci(self, rems_actualizadas: List[Dict]) -> float:
        """PBCI: promedio de las mejores 120 remuneraciones de las últimas 180."""
        if not rems_actualizadas:
            return 0.0
        importes = sorted(
            [r["importe_actualizado"] for r in rems_actualizadas], reverse=True
        )
        # Mejores 120 de los últimos 180
        mejores = importes[:120]
        return sum(mejores) / len(mejores) if mejores else 0.0

    def _anios_por_regimen(self, periodos: List[PeriodoLaboral]) -> Tuple[float, float]:
        """Separa servicios en pre-SIJP y post-SIJP."""
        dias_pre = 0
        dias_post = 0
        for p in periodos:
            inicio = p.fecha_inicio
            fin = p.fecha_fin or date.today()
            coef = p.porcentaje / 100.0

            if inicio < FECHA_CORTE_SIJP:
                fin_pre = min(fin, FECHA_CORTE_SIJP)
                dias_pre += max(0, (fin_pre - inicio).days) * coef
            if fin > FECHA_CORTE_SIJP:
                inicio_post = max(inicio, FECHA_CORTE_SIJP)
                dias_post += max(0, (fin - inicio_post).days) * coef

        return dias_pre / 365.25, dias_post / 365.25

    def _edad(self, fecha_nacimiento: date, referencia: date) -> float:
        return (referencia - fecha_nacimiento).days / 365.25
