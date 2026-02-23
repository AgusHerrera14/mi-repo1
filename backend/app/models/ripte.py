from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class TablaRIPTE(Base):
    """
    RIPTE: Remuneración Imponible Promedio de los Trabajadores Estables.
    Publicado mensualmente por el MTEySS (Ministerio de Trabajo).
    Utilizado para calcular la movilidad previsional (Ley 26.417, 27.609).
    """
    __tablename__ = "tabla_ripte"

    id = Column(Integer, primary_key=True, index=True)
    periodo = Column(String(7), unique=True, index=True, nullable=False)  # YYYY-MM
    valor = Column(Float, nullable=False)
    variacion_mensual = Column(Float)        # % variación vs mes anterior
    variacion_trimestral = Column(Float)     # % variación vs 3 meses atrás
    variacion_anual = Column(Float)          # % variación vs 12 meses atrás
    fuente = Column(String(100), default="MTEySS")
    verificado = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
