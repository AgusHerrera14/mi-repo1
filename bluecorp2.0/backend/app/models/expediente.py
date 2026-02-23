"""
Expedientes administrativos previsionales.
Registra el trámite desde la solicitud hasta la resolución/otorgamiento.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Expediente(Base):
    __tablename__ = "expedientes"

    id = Column(Integer, primary_key=True, index=True)
    afiliado_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False)

    numero_expediente = Column(String(30), unique=True, index=True, nullable=False)
    tipo_tramite = Column(String(60), nullable=False)
    # jubilacion_ordinaria | jubilacion_edad_avanzada | retiro_invalidez
    # pension_fallecimiento | pua | revision_haber | rehabilitacion
    # suspension | baja | cambio_prestacion

    estado = Column(String(30), default="iniciado")
    # iniciado | en_tramite | con_observaciones | aprobado | denegado | archivado

    fecha_inicio = Column(Date, nullable=False)
    fecha_resolucion = Column(Date)
    numero_resolucion = Column(String(50))

    # Datos del solicitante (puede ser el propio o un representante)
    solicitante_nombre = Column(String(200))
    solicitante_cuil = Column(String(11))
    es_apoderado = Column(Boolean, default=False)

    # Checklist de documentación
    doc_dni = Column(Boolean, default=False)
    doc_partida_nacimiento = Column(Boolean, default=False)
    doc_certificados_aportes = Column(Boolean, default=False)
    doc_declaracion_jurada = Column(Boolean, default=False)
    doc_certificado_laboral = Column(Boolean, default=False)
    doc_partida_matrimonio = Column(Boolean, default=False)
    doc_certificado_medico = Column(Boolean, default=False)  # Para invalidez
    doc_otros = Column(Text)  # JSON list de otros documentos

    observaciones = Column(Text)
    notas_internas = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    asignado_a = Column(Integer, ForeignKey("users.id"))

    afiliado = relationship("Affiliate", back_populates="expedientes")
    movimientos = relationship(
        "MovimientoExpediente", back_populates="expediente", cascade="all, delete-orphan"
    )


class MovimientoExpediente(Base):
    __tablename__ = "movimientos_expediente"

    id = Column(Integer, primary_key=True, index=True)
    expediente_id = Column(Integer, ForeignKey("expedientes.id"), nullable=False)

    fecha = Column(DateTime(timezone=True), server_default=func.now())
    tipo = Column(String(50), nullable=False)
    # estado_nuevo | observacion | documento_adjunto | asignacion | resolucion
    estado_anterior = Column(String(30))
    estado_nuevo = Column(String(30))
    descripcion = Column(String(500), nullable=False)
    usuario_id = Column(Integer, ForeignKey("users.id"))

    expediente = relationship("Expediente", back_populates="movimientos")
