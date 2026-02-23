from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class TablaMovilidad(Base):
    __tablename__ = "tabla_movilidad"

    id = Column(Integer, primary_key=True, index=True)
    periodo = Column(String(7), unique=True, index=True, nullable=False)
    vigencia_desde = Column(String(10), nullable=False)
    vigencia_hasta = Column(String(10))
    porcentaje_aumento = Column(Float, nullable=False)
    coeficiente = Column(Float, nullable=False)
    coeficiente_acumulado = Column(Float)
    ley_aplicada = Column(String(50))
    formula_aplicada = Column(String(200))
    componente_ripte = Column(Float)
    componente_ipc = Column(Float)
    resolucion_anses = Column(String(50))
    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
