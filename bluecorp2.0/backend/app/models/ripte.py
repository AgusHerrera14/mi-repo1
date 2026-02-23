from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class TablaRIPTE(Base):
    __tablename__ = "tabla_ripte"

    id = Column(Integer, primary_key=True, index=True)
    periodo = Column(String(7), unique=True, index=True, nullable=False)
    valor = Column(Float, nullable=False)
    variacion_mensual = Column(Float)
    variacion_trimestral = Column(Float)
    variacion_anual = Column(Float)
    fuente = Column(String(100), default="MTEySS")
    verificado = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
