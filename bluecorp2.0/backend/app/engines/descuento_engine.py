"""
Motor de Cálculo de Descuentos sobre Haberes
=============================================
Aplica en orden de prioridad legal:
  1. PAMI (obligatorio) - 3% haber bruto
  2. Embargos (orden judicial, máx. 20% del haber neto)
  3. Sindicatos / Mutuales (voluntarios)
  4. Otros (préstamos, seguros, cuotas)

Límite legal de descuentos (Art. 120 Ley 24.241):
  El haber neto nunca puede ser inferior al 70% del haber bruto.
  (i.e., los descuentos voluntarios no pueden superar el 30% del haber bruto)
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class DescuentoAplicado:
    tipo: str
    descripcion: str
    importe_calculado: float
    importe_aplicado: float   # puede ser menor si se alcanzó el tope
    fue_tronchado: bool = False
    base_calculo: float = 0.0


@dataclass
class ResultadoDescuentos:
    haber_con_movilidad: float
    descuentos: List[DescuentoAplicado] = field(default_factory=list)
    total_descuentos: float = 0.0
    haber_neto: float = 0.0
    tope_aplicado: bool = False


class MotorDescuentos:

    TASA_PAMI = 0.03
    # El haber neto no puede ser inferior al 70% del bruto (Art. 120)
    MIN_HABER_NETO_PCT = 0.70
    # Embargos: no puede superar el 20% del haber neto (Ley 24.432)
    MAX_EMBARGO_PCT = 0.20

    def calcular(
        self,
        haber_con_movilidad: float,
        descuentos_voluntarios: List[dict],  # lista de DescuentoVoluntario serializado
    ) -> ResultadoDescuentos:
        """
        Aplica todos los descuentos en orden de prioridad legal.

        descuentos_voluntarios: lista de dicts con campos:
          tipo, descripcion, modalidad, importe_fijo, porcentaje,
          base_calculo, prioridad
        """
        resultado = ResultadoDescuentos(haber_con_movilidad=haber_con_movilidad)
        saldo_disponible = haber_con_movilidad
        min_haber_neto = haber_con_movilidad * self.MIN_HABER_NETO_PCT

        # ── 1. PAMI (obligatorio, siempre primero) ──────────────────────
        pami = round(haber_con_movilidad * self.TASA_PAMI, 2)
        resultado.descuentos.append(DescuentoAplicado(
            tipo="pami",
            descripcion="PAMI (Ley 19.032) - 3%",
            importe_calculado=pami,
            importe_aplicado=pami,
            base_calculo=haber_con_movilidad,
        ))
        saldo_disponible -= pami

        # ── 2. Embargos (orden judicial, prioridad legal) ────────────────
        embargos = sorted(
            [d for d in descuentos_voluntarios if d["tipo"] == "embargo"],
            key=lambda x: x.get("prioridad", 99)
        )
        for emb in embargos:
            tope_embargo = saldo_disponible * self.MAX_EMBARGO_PCT
            calculado = self._calcular_importe(emb, haber_con_movilidad, saldo_disponible)
            aplicado = min(calculado, tope_embargo, max(0, saldo_disponible - min_haber_neto))
            fue_tronchado = aplicado < calculado
            resultado.descuentos.append(DescuentoAplicado(
                tipo="embargo",
                descripcion=emb.get("descripcion", "Embargo"),
                importe_calculado=calculado,
                importe_aplicado=round(aplicado, 2),
                fue_tronchado=fue_tronchado,
                base_calculo=saldo_disponible,
            ))
            saldo_disponible -= aplicado

        # ── 3. Voluntarios (sindicatos, mutuales, préstamos, seguros) ────
        voluntarios = sorted(
            [d for d in descuentos_voluntarios if d["tipo"] != "embargo"],
            key=lambda x: x.get("prioridad", 99)
        )
        for vol in voluntarios:
            calculado = self._calcular_importe(vol, haber_con_movilidad, saldo_disponible)
            max_posible = max(0, saldo_disponible - min_haber_neto)
            aplicado = min(calculado, max_posible)
            fue_tronchado = aplicado < calculado

            if aplicado <= 0 and calculado > 0:
                # No hay margen: registrar con 0 y marcar como tronchado
                fue_tronchado = True

            resultado.descuentos.append(DescuentoAplicado(
                tipo=vol.get("tipo", "otro"),
                descripcion=vol.get("descripcion", "Descuento"),
                importe_calculado=calculado,
                importe_aplicado=round(aplicado, 2),
                fue_tronchado=fue_tronchado,
                base_calculo=haber_con_movilidad,
            ))
            saldo_disponible -= aplicado
            if fue_tronchado:
                resultado.tope_aplicado = True

        resultado.total_descuentos = round(
            sum(d.importe_aplicado for d in resultado.descuentos), 2
        )
        resultado.haber_neto = round(haber_con_movilidad - resultado.total_descuentos, 2)
        return resultado

    def _calcular_importe(self, descuento: dict, haber_bruto: float, haber_disponible: float) -> float:
        modalidad = descuento.get("modalidad", "fijo")
        if modalidad == "fijo":
            return descuento.get("importe_fijo", 0.0)
        elif modalidad == "porcentaje":
            base = haber_bruto if descuento.get("base_calculo") == "haber_bruto" else haber_disponible
            return base * (descuento.get("porcentaje", 0) / 100)
        elif modalidad == "cuotas":
            return descuento.get("importe_por_cuota", 0.0)
        return 0.0
