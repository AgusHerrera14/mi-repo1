from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Liquidacion(Base):
    __tablename__ = "liquidaciones"

    id = Column(Integer, primary_key=True, index=True)
    afiliado_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False)
    numero_liquidacion = Column(String(20), unique=True, index=True)

    tipo = Column(String(30), default="mensual", nullable=False)
    # mensual | retroactivo | sac | suplemento | inicial | complemento_zona
    estado = Column(String(30), default="borrador")
    # borrador | calculada | autorizada | pagada | anulada
    periodo = Column(String(7), nullable=False)     # YYYY-MM
    fecha_pago = Column(Date)

    # ── Haber previsional ────────────────────────────────────────────────
    pbu = Column(Float, default=0.0)
    pc = Column(Float, default=0.0)
    pap = Column(Float, default=0.0)
    complemento_zona = Column(Float, default=0.0)
    haber_bruto = Column(Float, default=0.0)
    haber_minimo_garantizado = Column(Float, default=0.0)

    # ── Movilidad ────────────────────────────────────────────────────────
    coeficiente_movilidad = Column(Float, default=1.0)
    porcentaje_movilidad = Column(Float, default=0.0)
    haber_con_movilidad = Column(Float, default=0.0)

    # ── Novedades del período ────────────────────────────────────────────
    importe_novedades = Column(Float, default=0.0)  # suma de novedades +/-

    # ── SAC (si tipo == "sac") ───────────────────────────────────────────
    mejor_haber_semestre = Column(Float, default=0.0)
    importe_sac = Column(Float, default=0.0)

    # ── Retroactivo ──────────────────────────────────────────────────────
    meses_retroactivo = Column(Integer, default=0)
    importe_retroactivo = Column(Float, default=0.0)
    periodo_retro_desde = Column(String(7))
    periodo_retro_hasta = Column(String(7))

    # ── Descuentos ───────────────────────────────────────────────────────
    descuento_pami = Column(Float, default=0.0)         # 3% Ley 19.032
    descuento_sindicato = Column(Float, default=0.0)
    descuento_mutual = Column(Float, default=0.0)
    descuento_embargo = Column(Float, default=0.0)
    descuento_otro = Column(Float, default=0.0)
    total_descuentos = Column(Float, default=0.0)

    # ── Haber neto ───────────────────────────────────────────────────────
    haber_neto = Column(Float, default=0.0)

    # ── Pago ─────────────────────────────────────────────────────────────
    banco_pago = Column(String(100))
    cbu_pago = Column(String(22))
    forma_pago = Column(String(30))

    # ── Auditoría ────────────────────────────────────────────────────────
    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    autorizado_by = Column(Integer, ForeignKey("users.id"))
    fecha_autorizacion = Column(DateTime(timezone=True))

    # Relaciones
    afiliado = relationship("Affiliate", back_populates="liquidaciones")
    items = relationship(
        "ItemLiquidacion", back_populates="liquidacion", cascade="all, delete-orphan"
    )


class ItemLiquidacion(Base):
    __tablename__ = "items_liquidacion"

    id = Column(Integer, primary_key=True, index=True)
    liquidacion_id = Column(Integer, ForeignKey("liquidaciones.id"), nullable=False)
    codigo_concepto = Column(String(10))
    concepto = Column(String(200), nullable=False)
    tipo = Column(String(10), nullable=False)   # haber | descuento
    importe = Column(Float, nullable=False)
    porcentaje = Column(Float)
    base_calculo = Column(Float)
    observacion = Column(String(500))

    liquidacion = relationship("Liquidacion", back_populates="items")
