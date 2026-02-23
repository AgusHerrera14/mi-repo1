from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date,
    Enum, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class Sexo(str, enum.Enum):
    MASCULINO = "M"
    FEMENINO = "F"


class EstadoCivil(str, enum.Enum):
    SOLTERO = "soltero"
    CASADO = "casado"
    DIVORCIADO = "divorciado"
    VIUDO = "viudo"
    UNION_CONVIVENCIAL = "union_convivencial"


class TipoPrestacion(str, enum.Enum):
    JUBILACION_ORDINARIA = "jubilacion_ordinaria"
    JUBILACION_POR_EDAD_AVANZADA = "jubilacion_edad_avanzada"
    RETIRO_POR_INVALIDEZ = "retiro_invalidez"
    PENSION_POR_FALLECIMIENTO = "pension_fallecimiento"
    PUA = "pua"  # Prestación Universal Adulto Mayor


class EstadoAfiliado(str, enum.Enum):
    ACTIVO = "activo"
    PASIVO = "pasivo"
    SOLICITANTE = "solicitante"
    SUSPENDIDO = "suspendido"
    BAJA = "baja"


class Affiliate(Base):
    __tablename__ = "affiliates"

    id = Column(Integer, primary_key=True, index=True)
    cuil = Column(String(11), unique=True, index=True, nullable=False)
    dni = Column(String(10), unique=True, index=True, nullable=False)
    apellido = Column(String(100), nullable=False)
    nombre = Column(String(100), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    sexo = Column(String(1), nullable=False)
    estado_civil = Column(String(30), default=EstadoCivil.SOLTERO)
    nacionalidad = Column(String(50), default="Argentina")

    # Contacto
    domicilio = Column(String(200))
    localidad = Column(String(100))
    provincia = Column(String(50))
    codigo_postal = Column(String(10))
    telefono = Column(String(20))
    email = Column(String(100))

    # Datos previsionales
    tipo_prestacion = Column(String(50), nullable=False)
    estado = Column(String(30), default=EstadoAfiliado.SOLICITANTE)
    fecha_alta = Column(Date)
    fecha_baja = Column(Date)
    numero_beneficio = Column(String(20), unique=True, index=True)

    # Cuenta bancaria
    banco = Column(String(100))
    tipo_cuenta = Column(String(20))
    numero_cuenta = Column(String(30))
    cbu = Column(String(22))
    alias_cbu = Column(String(50))

    # Cálculo previsional
    anios_aportes_pre_sijp = Column(Float, default=0.0)
    anios_aportes_post_sijp = Column(Float, default=0.0)
    promedio_remuneraciones = Column(Float, default=0.0)
    pbu_calculada = Column(Float, default=0.0)
    pc_calculada = Column(Float, default=0.0)
    pap_calculada = Column(Float, default=0.0)
    haber_inicial = Column(Float, default=0.0)
    haber_actual = Column(Float, default=0.0)

    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    observaciones = Column(Text)

    # Relaciones
    periodos_laborales = relationship("AfiliadoPeriodoLaboral", back_populates="afiliado", cascade="all, delete-orphan")
    remuneraciones = relationship("AfiliadoRemuneracion", back_populates="afiliado", cascade="all, delete-orphan")
    liquidaciones = relationship("Liquidacion", back_populates="afiliado")


class AfiliadoPeriodoLaboral(Base):
    __tablename__ = "periodos_laborales"

    id = Column(Integer, primary_key=True, index=True)
    afiliado_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False)
    empleador = Column(String(200), nullable=False)
    cuit_empleador = Column(String(11))
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date)
    categoria = Column(String(100))
    convenio_colectivo = Column(String(100))
    tipo_relacion = Column(String(50), default="dependencia")  # dependencia, autonomo, monotributo
    aportes_verificados = Column(Boolean, default=False)
    observaciones = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    afiliado = relationship("Affiliate", back_populates="periodos_laborales")


class AfiliadoRemuneracion(Base):
    __tablename__ = "remuneraciones"

    id = Column(Integer, primary_key=True, index=True)
    afiliado_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False)
    periodo = Column(String(7), nullable=False)  # YYYY-MM
    remuneracion_bruta = Column(Float, nullable=False)
    remuneracion_imponible = Column(Float, nullable=False)
    aporte_personal = Column(Float)  # 11% sobre imponible
    contribucion_patronal = Column(Float)  # 16% sobre imponible
    ingresado_anses = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    afiliado = relationship("Affiliate", back_populates="remuneraciones")
