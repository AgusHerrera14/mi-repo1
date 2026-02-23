"""
Novedades: eventos que modifican el haber de un período.
Ej.: suspensión por compatibilidad laboral, reincorporación,
reintegro de aportes, corrección de datos, retroactivo manual.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Novedad(Base):
    __tablename__ = "novedades"

    id = Column(Integer, primary_key=True, index=True)
    afiliado_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False)

    tipo = Column(String(40), nullable=False)
    # suspension_laboral | reincorporacion | fallecimiento | baja_voluntaria
    # cambio_banco | cambio_domicilio | cambio_estado_civil | incompatibilidad
    # reintegro_aportes | retroactivo_manual | embargo_nuevo | embargo_baja
    # alta_descuento | baja_descuento | corrección_haber | suplemento

    descripcion = Column(String(500), nullable=False)
    periodo_desde = Column(String(7))           # YYYY-MM (período de efecto)
    periodo_hasta = Column(String(7))
    importe_impacto = Column(Float, default=0.0)  # Impacto en ARS (+/-)
    impacta_haber = Column(Boolean, default=False)

    estado = Column(String(20), default="pendiente")
    # pendiente | procesada | rechazada | anulada

    # Adjunto / resolución
    numero_resolucion = Column(String(50))
    organismo_origen = Column(String(100))

    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    procesado_by = Column(Integer, ForeignKey("users.id"))
    fecha_procesado = Column(DateTime(timezone=True))

    afiliado = relationship("Affiliate", back_populates="novedades")
