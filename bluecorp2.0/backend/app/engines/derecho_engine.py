"""
Motor de Determinación del Derecho Previsional - Blue Corp
===========================================================
Módulo 1 de Blue Corp: Determina si una persona tiene derecho a una prestación.

Prestaciones analizadas:
  - Jubilación Ordinaria (Art. 17, Ley 24.241)
  - Retiro por Invalidez (Art. 48, Ley 24.241)
  - Pensión por Fallecimiento (Art. 53, Ley 24.241)
  - PUAM (Ley 27.160)
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import date


@dataclass
class ServicioImportado:
    """Período laboral tal como viene de la Historia Laboral de Mi ANSES."""
    periodo: str           # YYYY-MM
    empleador: str
    tipo_relacion: str     # RL=Relación de Dependencia, AU=Autónomo, MT=Monotributo
    dias_trabajados: int = 30
    tiene_aportes: bool = True


@dataclass
class ResultadoDerecho:
    tipo_beneficio: str = ""
    tiene_derecho: bool = False

    # Edad
    fecha_nacimiento: Optional[date] = None
    edad_actual: float = 0.0
    edad_requerida: float = 0.0
    cumple_edad: bool = False
    meses_faltantes_edad: int = 0

    # Servicios y aportes
    anios_totales: float = 0.0
    anios_pre_sijp: float = 0.0
    anios_post_sijp: float = 0.0
    anios_requeridos: float = 30.0
    cumple_aportes: bool = False
    meses_faltantes_aportes: int = 0

    # Regularidad
    total_meses_verificados: int = 0
    meses_con_aportes: int = 0
    porcentaje_regularidad: float = 0.0
    cumple_regularidad: bool = False

    # Observaciones y diagnóstico
    observaciones: List[str] = field(default_factory=list)
    diagnostico: str = ""
    haber_estimado_minimo: float = 0.0  # si hubiera derecho

    # Detalle completo
    detalle: Dict = field(default_factory=dict)


FECHA_CORTE_SIJP = date(1994, 7, 1)


class MotorDerecho:
    """
    Determina el derecho previsional de una persona.
    """

    EDAD_MINIMA_HOMBRE = 65
    EDAD_MINIMA_MUJER = 60
    ANIOS_MIN_APORTES = 30.0
    REGULARIDAD_MIN = 0.50   # 50% de meses con aportes
    INCAPACIDAD_MIN = 66.0   # % para retiro por invalidez

    def determinar_jubilacion_ordinaria(
        self,
        fecha_nacimiento: date,
        sexo: str,
        servicios: List[ServicioImportado],
        fecha_calculo: Optional[date] = None,
    ) -> ResultadoDerecho:
        """
        Determina derecho a Jubilación Ordinaria.
        Requisitos Art. 17, Ley 24.241:
          - Hombres: 65 años + 30 años de servicios con aportes
          - Mujeres: 60 años + 30 años de servicios con aportes
          - Regularidad: aportes en al menos el 50% de los meses
        """
        r = ResultadoDerecho(tipo_beneficio="jubilacion_ordinaria",
                              fecha_nacimiento=fecha_nacimiento)
        fd = fecha_calculo or date.today()

        # Edad
        r.edad_actual = (fd - fecha_nacimiento).days / 365.25
        r.edad_requerida = float(
            self.EDAD_MINIMA_HOMBRE if sexo.upper() == "M" else self.EDAD_MINIMA_MUJER
        )
        r.cumple_edad = r.edad_actual >= r.edad_requerida
        if not r.cumple_edad:
            meses_diff = int((r.edad_requerida - r.edad_actual) * 12)
            r.meses_faltantes_edad = meses_diff
            r.observaciones.append(
                f"Faltan {meses_diff} meses para cumplir la edad mínima de {int(r.edad_requerida)} años."
            )

        # Servicios
        anios_pre, anios_post, meses_aportados, meses_total = self._analizar_servicios(servicios)
        r.anios_pre_sijp = anios_pre
        r.anios_post_sijp = anios_post
        r.anios_totales = anios_pre + anios_post
        r.meses_con_aportes = meses_aportados
        r.total_meses_verificados = meses_total
        r.porcentaje_regularidad = (meses_aportados / meses_total * 100) if meses_total > 0 else 0.0
        r.cumple_regularidad = r.porcentaje_regularidad >= (self.REGULARIDAD_MIN * 100)
        r.cumple_aportes = r.anios_totales >= self.ANIOS_MIN_APORTES

        if not r.cumple_aportes:
            meses_diff = int((self.ANIOS_MIN_APORTES - r.anios_totales) * 12)
            r.meses_faltantes_aportes = meses_diff
            r.observaciones.append(
                f"Faltan {meses_diff} meses de aportes (reconocidos: {r.anios_totales:.2f} años)."
            )
        if not r.cumple_regularidad:
            r.observaciones.append(
                f"Regularidad insuficiente: {r.porcentaje_regularidad:.1f}% (mínimo requerido: 50%)."
            )

        r.tiene_derecho = r.cumple_edad and r.cumple_aportes
        r.diagnostico = (
            "DERECHO RECONOCIDO — Cumple todos los requisitos de la Jubilación Ordinaria (Art. 17, Ley 24.241)."
            if r.tiene_derecho
            else "DERECHO NO RECONOCIDO — " + " | ".join(r.observaciones)
        )

        r.detalle = {
            "fecha_calculo": str(fd),
            "sexo": sexo.upper(),
            "total_servicios_importados": len(servicios),
            "periodos_pre_sijp": f"{anios_pre:.2f} años",
            "periodos_post_sijp": f"{anios_post:.2f} años",
            "regularidad": f"{r.porcentaje_regularidad:.1f}%",
            "ley": "Art. 17-18, Ley 24.241",
        }
        return r

    def determinar_retiro_invalidez(
        self,
        fecha_nacimiento: date,
        servicios: List[ServicioImportado],
        porcentaje_incapacidad: float,
        fecha_calculo: Optional[date] = None,
    ) -> ResultadoDerecho:
        """
        Retiro por Invalidez (Art. 48, Ley 24.241).
        Requisitos: incapacidad >= 66% + aportes en 18 de los últimos 36 meses.
        """
        r = ResultadoDerecho(tipo_beneficio="retiro_invalidez", fecha_nacimiento=fecha_nacimiento)
        fd = fecha_calculo or date.today()

        r.edad_actual = (fd - fecha_nacimiento).days / 365.25
        r.cumple_edad = True  # no hay requisito de edad

        if porcentaje_incapacidad < self.INCAPACIDAD_MIN:
            r.observaciones.append(
                f"Incapacidad declarada ({porcentaje_incapacidad}%) es inferior al 66% requerido."
            )
        else:
            r.cumple_aportes = True

        r.tiene_derecho = porcentaje_incapacidad >= self.INCAPACIDAD_MIN
        r.diagnostico = (
            "DERECHO RECONOCIDO — Cumple requisitos del Retiro por Invalidez (Art. 48, Ley 24.241)."
            if r.tiene_derecho
            else f"DERECHO NO RECONOCIDO — Incapacidad insuficiente: {porcentaje_incapacidad}%."
        )
        return r

    def determinar_pension_fallecimiento(
        self,
        tipo_derechohabiente: str,  # conyuge|conviviente|hijo_menor|hijo_discapacitado|padre
        tiene_beneficio_propio: bool = False,
    ) -> ResultadoDerecho:
        """
        Pensión por Fallecimiento (Art. 53, Ley 24.241).
        """
        r = ResultadoDerecho(tipo_beneficio="pension_fallecimiento")
        r.tiene_derecho = True
        if tiene_beneficio_propio and tipo_derechohabiente in ("conyuge", "conviviente"):
            r.observaciones.append(
                "Percibe beneficio propio: puede haber incompatibilidad parcial (Art. 34, Ley 24.241)."
            )
        r.diagnostico = (
            f"DERECHO RECONOCIDO — {tipo_derechohabiente} tiene derecho a pensión "
            "(Art. 53-68, Ley 24.241)."
        )
        return r

    def determinar_puam(
        self,
        fecha_nacimiento: date,
        sexo: str,
        fecha_calculo: Optional[date] = None,
    ) -> ResultadoDerecho:
        """
        PUAM (Ley 27.160): 65 años + sin otro beneficio + sin cónyuge/conviviente con beneficio.
        """
        r = ResultadoDerecho(tipo_beneficio="PUAM", fecha_nacimiento=fecha_nacimiento)
        fd = fecha_calculo or date.today()
        r.edad_actual = (fd - fecha_nacimiento).days / 365.25
        r.edad_requerida = 65.0
        r.cumple_edad = r.edad_actual >= 65.0
        r.tiene_derecho = r.cumple_edad
        r.diagnostico = (
            "DERECHO RECONOCIDO — PUAM (Ley 27.160)."
            if r.tiene_derecho
            else f"No cumple la edad mínima de 65 años (actual: {r.edad_actual:.1f})."
        )
        return r

    # ── Métodos privados ─────────────────────────────────────────────────────

    def _analizar_servicios(
        self, servicios: List[ServicioImportado]
    ):
        """Analiza los servicios y retorna (anios_pre, anios_post, meses_aportados, meses_total)."""
        periodos_con_aportes = set()
        for s in servicios:
            if s.tiene_aportes:
                periodos_con_aportes.add(s.periodo)

        meses_pre = 0
        meses_post = 0
        for p in periodos_con_aportes:
            anio, mes = int(p[:4]), int(p[5:7])
            fd = date(anio, mes, 1)
            if fd < FECHA_CORTE_SIJP:
                meses_pre += 1
            else:
                meses_post += 1

        anios_pre = meses_pre / 12.0
        anios_post = meses_post / 12.0

        # Meses total verificados (todos los periodos importados)
        todos_periodos = set(s.periodo for s in servicios)
        meses_total = len(todos_periodos)
        meses_aportados = len(periodos_con_aportes)

        return anios_pre, anios_post, meses_aportados, meses_total
