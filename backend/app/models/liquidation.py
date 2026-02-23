from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class EstadoLiquidacion(str, enum.Enum):
    BORRADOR = "borrador"
    CALCULADA = "calculada"
    AUTORIZADA = "autorizada"
    PAGADA = "pagada"
    ANULADA = "anulada"


class TipoLiquidacion(str, enum.Enum):
    MENSUAL = "mensual"
    RETROACTIVO = "retroactivo"
    SUPLEMENTO = "suplemento"
    AGUINALDO = "aguinaldo"
    INICIAL = "inicial"


class Liquidacion(Base):
    __tablename__ = "liquidaciones"

    id = Column(Integer, primary_key=True, index=True)
    afiliado_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False)
    numero_liquidacion = Column(String(20), unique=True, index=True)

    tipo = Column(String(30), default=TipoLiquidacion.MENSUAL, nullable=False)
    estado = Column(String(30), default=EstadoLiquidacion.BORRADOR)
    periodo = Column(String(7), nullable=False)  # YYYY-MM
    fecha_pago = Column(Date)

    # Importes base
    pbu = Column(Float, default=0.0)
    pc = Column(Float, default=0.0)
    pap = Column(Float, default=0.0)
    haber_bruto = Column(Float, default=0.0)
    haber_minimo_garantizado = Column(Float, default=0.0)

    # Movilidad aplicada
    coeficiente_movilidad = Column(Float, default=1.0)
    haber_con_movilidad = Column(Float, default=0.0)

    # Descuentos
    descuento_obra_social = Column(Float, default=0.0)   # 3% PAMI
    descuento_otro = Column(Float, default=0.0)
    total_descuentos = Column(Float, default=0.0)

    # Retroactivo (si aplica)
    meses_retroactivo = Column(Integer, default=0)
    importe_retroactivo = Column(Float, default=0.0)

    # Haber neto final
    haber_neto = Column(Float, default=0.0)

    # Datos de pago
    banco_pago = Column(String(100))
    cbu_pago = Column(String(22))

    # Observaciones y auditoría
    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    autorizado_by = Column(Integer, ForeignKey("users.id"))
    fecha_autorizacion = Column(DateTime(timezone=True))

    # Relaciones
    afiliado = relationship("Affiliate", back_populates="liquidaciones")
    items = relationship("ItemLiquidacion", back_populates="liquidacion", cascade="all, delete-orphan")


class ItemLiquidacion(Base):
    __tablename__ = "items_liquidacion"

    id = Column(Integer, primary_key=True, index=True)
    liquidacion_id = Column(Integer, ForeignKey("liquidaciones.id"), nullable=False)
    concepto = Column(String(200), nullable=False)
    codigo_concepto = Column(String(20))
    tipo = Column(String(10), nullable=False)  # "haber" o "descuento"
    importe = Column(Float, nullable=False)
    porcentaje = Column(Float)
    base_calculo = Column(Float)
    observacion = Column(String(500))

    liquidacion = relationship("Liquidacion", back_populates="items")
