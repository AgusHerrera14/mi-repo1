"""
Descuentos Voluntarios / Obligatorios sobre el haber previsional.
Incluye: sindicatos, mutuales, embargos, préstamos, cuotas de planes.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class DescuentoVoluntario(Base):
    __tablename__ = "descuentos_voluntarios"

    id = Column(Integer, primary_key=True, index=True)
    afiliado_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False)

    tipo = Column(String(30), nullable=False)
    # sindicato | mutual | embargo | prestamo | plan_cuotas | seguro | otro
    descripcion = Column(String(200), nullable=False)
    beneficiario = Column(String(200))           # Nombre de la entidad receptora
    cuit_beneficiario = Column(String(11))
    numero_convenio = Column(String(50))

    modalidad = Column(String(20), default="fijo")
    # fijo | porcentaje | cuotas
    importe_fijo = Column(Float, default=0.0)
    porcentaje = Column(Float, default=0.0)
    base_calculo = Column(String(30), default="haber_neto")
    # haber_bruto | haber_con_movilidad | haber_neto

    # Para descuentos en cuotas
    total_cuotas = Column(Integer, default=0)
    cuotas_pagadas = Column(Integer, default=0)
    importe_total = Column(Float, default=0.0)
    importe_por_cuota = Column(Float, default=0.0)
    saldo_pendiente = Column(Float, default=0.0)

    # Vigencia
    activo = Column(Boolean, default=True)
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)

    prioridad = Column(Integer, default=1)  # Para embargos con prioridad legal

    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    afiliado = relationship("Affiliate", back_populates="descuentos_voluntarios")
