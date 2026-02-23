from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.core.database import Base


class TablaMovilidad(Base):
    """
    Tabla de coeficientes de movilidad previsional.
    Aplicada trimestralmente según Ley 26.417 (2008), 27.426 (2017),
    27.609 (2021) y normativa posterior.

    Cada fila representa un trimestre de ajuste.
    El coeficiente acumulado se aplica desde el haber inicial.
    """
    __tablename__ = "tabla_movilidad"

    id = Column(Integer, primary_key=True, index=True)
    periodo = Column(String(7), unique=True, index=True, nullable=False)  # YYYY-QN (e.g., 2024-Q1)
    vigencia_desde = Column(String(10), nullable=False)   # YYYY-MM-DD
    vigencia_hasta = Column(String(10))
    porcentaje_aumento = Column(Float, nullable=False)    # % de aumento en el trimestre
    coeficiente = Column(Float, nullable=False)           # Factor multiplicador (1 + porcentaje/100)
    coeficiente_acumulado = Column(Float)                 # Producto acumulado desde base
    ley_aplicada = Column(String(50))
    formula_aplicada = Column(String(200))                # Descripción de la fórmula usada
    componente_ripte = Column(Float)                     # % aporte del RIPTE
    componente_ipc = Column(Float)                       # % aporte del IPC
    componente_recaudacion = Column(Float)               # % aporte de recaudación
    resolucion_anses = Column(String(50))
    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
