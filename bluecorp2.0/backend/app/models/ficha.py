"""
Modelos de Ficha Previsional - Blue Corp
=========================================
La Ficha es el expediente cliente principal en Blue Corp.
Contiene los datos del causante, sus servicios y remuneraciones.
"""

import uuid
from datetime import date, datetime
from sqlalchemy import (
    Column, String, Float, Boolean, Date, DateTime, 
    ForeignKey, Integer, JSON, Text, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TipoBeneficio(str, enum.Enum):
    JUBILACION_ORDINARIA = "jubilacion_ordinaria"
    PENSION_FALLECIMIENTO = "pension_fallecimiento"
    RETIRO_INVALIDEZ = "retiro_invalidez"
    PUAM = "PUAM"


class EstadoFicha(str, enum.Enum):
    BORRADOR = "borrador"
    CALCULADA = "calculada"
    LIQUIDADA = "liquidada"


class Ficha(Base):
    """Ficha del cliente/causante — entidad central de Blue Corp."""
    __tablename__ = "fichas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero = Column(String(20), unique=True, nullable=True)  # ej: "001/2025"

    # Datos personales
    apellido_nombre = Column(String(200), nullable=False)
    cuil = Column(String(13), nullable=False)
    dni = Column(String(15), nullable=True)
    fecha_nacimiento = Column(Date, nullable=False)
    sexo = Column(String(1), nullable=False)  # M/F
    domicilio = Column(String(300), nullable=True)
    localidad = Column(String(100), nullable=True)
    provincia = Column(String(100), nullable=True)
    email = Column(String(200), nullable=True)
    telefono = Column(String(50), nullable=True)

    # Beneficio
    tipo_beneficio = Column(String(30), nullable=False, default="jubilacion_ordinaria")
    fecha_cese = Column(Date, nullable=True)
    fecha_calculo = Column(Date, nullable=True)
    observaciones_generales = Column(Text, nullable=True)

    # Estado
    estado = Column(String(20), nullable=False, default="borrador")

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relaciones
    servicios = relationship("Servicio", back_populates="ficha", cascade="all, delete-orphan", order_by="Servicio.fecha_inicio")
    remuneraciones = relationship("Remuneracion", back_populates="ficha", cascade="all, delete-orphan", order_by="Remuneracion.periodo")
    calculos_derecho = relationship("CalculoDerecho", back_populates="ficha", cascade="all, delete-orphan")
    calculos_haber = relationship("CalculoHaber", back_populates="ficha", cascade="all, delete-orphan")
    calculos_reajuste = relationship("CalculoReajuste", back_populates="ficha", cascade="all, delete-orphan")
    user = relationship("User", back_populates="fichas")


class Servicio(Base):
    """Período laboral dentro de una ficha."""
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ficha_id = Column(UUID(as_uuid=True), ForeignKey("fichas.id"), nullable=False)

    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)  # None = actualmente activo
    tipo = Column(String(20), nullable=False, default="dependencia")  # dependencia|autonomo|monotributo|especial
    regimen = Column(String(50), nullable=False, default="SIPA")  # SIPA|SNPS|docente|fuerzas_seguridad
    empleador = Column(String(200), nullable=True)
    cuit_empleador = Column(String(13), nullable=True)
    porcentaje = Column(Float, nullable=False, default=100.0)  # para regímenes diferenciales
    nota = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    ficha = relationship("Ficha", back_populates="servicios")


class Remuneracion(Base):
    """Remuneración mensual dentro de una ficha."""
    __tablename__ = "remuneraciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ficha_id = Column(UUID(as_uuid=True), ForeignKey("fichas.id"), nullable=False)

    periodo = Column(String(7), nullable=False)  # YYYY-MM
    importe_nominal = Column(Float, nullable=False)
    importe_actualizado = Column(Float, nullable=True)  # calculado
    factor_actualizacion = Column(Float, nullable=True)
    indice_actualizacion = Column(String(30), nullable=True)  # INGR|RIPTE|Movilidad
    tipo = Column(String(20), nullable=False, default="dependencia")
    empleador = Column(String(200), nullable=True)
    nota = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    ficha = relationship("Ficha", back_populates="remuneraciones")


class CalculoDerecho(Base):
    """Resultado de la determinación del derecho (Módulo 1)."""
    __tablename__ = "calculos_derecho"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ficha_id = Column(UUID(as_uuid=True), ForeignKey("fichas.id"), nullable=False)

    fecha_calculo = Column(Date, nullable=False)
    tipo_beneficio = Column(String(30), nullable=False)
    tiene_derecho = Column(Boolean, nullable=False, default=False)
    cumple_edad = Column(Boolean, nullable=False, default=False)
    edad_actual = Column(Float, nullable=True)
    edad_requerida = Column(Float, nullable=True)
    meses_faltantes_edad = Column(Integer, nullable=True, default=0)
    anios_totales = Column(Float, nullable=True, default=0.0)
    anios_pre_sijp = Column(Float, nullable=True, default=0.0)
    anios_post_sijp = Column(Float, nullable=True, default=0.0)
    cumple_aportes = Column(Boolean, nullable=False, default=False)
    meses_faltantes_aportes = Column(Integer, nullable=True, default=0)
    porcentaje_regularidad = Column(Float, nullable=True, default=0.0)
    cumple_regularidad = Column(Boolean, nullable=False, default=False)
    diagnostico = Column(Text, nullable=True)
    observaciones = Column(JSON, nullable=True)
    resultado_completo = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ficha = relationship("Ficha", back_populates="calculos_derecho")


class CalculoHaber(Base):
    """Resultado del cálculo del haber jubilatorio (Módulo 2)."""
    __tablename__ = "calculos_haber"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ficha_id = Column(UUID(as_uuid=True), ForeignKey("fichas.id"), nullable=False)

    fecha_calculo = Column(Date, nullable=False)
    tipo_beneficio = Column(String(30), nullable=False)
    tipo_calculo = Column(String(20), nullable=False, default="estimado")

    pbu = Column(Float, nullable=True, default=0.0)
    pc = Column(Float, nullable=True, default=0.0)
    pap = Column(Float, nullable=True, default=0.0)
    pap_transitoria = Column(Float, nullable=True, default=0.0)
    haber_bruto = Column(Float, nullable=True, default=0.0)
    haber_minimo_vigente = Column(Float, nullable=True, default=0.0)
    haber_maximo_vigente = Column(Float, nullable=True, default=0.0)
    haber_final = Column(Float, nullable=True, default=0.0)
    complemento_minimo = Column(Float, nullable=True, default=0.0)

    pbci = Column(Float, nullable=True, default=0.0)
    anios_pre_sijp = Column(Float, nullable=True, default=0.0)
    anios_post_sijp = Column(Float, nullable=True, default=0.0)
    anios_totales = Column(Float, nullable=True, default=0.0)

    resultado_completo = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ficha = relationship("Ficha", back_populates="calculos_haber")


class CalculoReajuste(Base):
    """Resultado del cálculo de reajuste judicial (Módulo 3)."""
    __tablename__ = "calculos_reajuste"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ficha_id = Column(UUID(as_uuid=True), ForeignKey("fichas.id"), nullable=False)

    fecha_calculo = Column(Date, nullable=False)
    tipo_reajuste = Column(String(30), nullable=False)  # solo_movilidad|badaro|delaude
    ley_aplicable = Column(String(100), nullable=True)
    periodo_inicio = Column(String(7), nullable=False)
    periodo_fin = Column(String(7), nullable=False)
    haber_base = Column(Float, nullable=False)
    periodo_base = Column(String(7), nullable=False)

    retroactivo_bruto = Column(Float, nullable=True, default=0.0)
    intereses_punitorios = Column(Float, nullable=True, default=0.0)
    intereses_resarcitorios = Column(Float, nullable=True, default=0.0)
    total_credito = Column(Float, nullable=True, default=0.0)

    diferencias_mensuales = Column(JSON, nullable=True)
    resultado_completo = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ficha = relationship("Ficha", back_populates="calculos_reajuste")
