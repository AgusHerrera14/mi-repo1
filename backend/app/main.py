"""
Blue Corp - Sistema de Gestión Previsional
==========================================
Backend API construida con FastAPI.
Implementa el Sistema Integrado Previsional Argentino (SIPA) - Ley 24.241.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash

from app.api.endpoints import auth, affiliates, liquidations, ripte, movilidad, reports, users

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
Sistema de Gestión Previsional - Blue Corp.

Implementa el cálculo de prestaciones previsionales del SIPA (Ley 24.241):
- **PBU**: Prestación Básica Universal
- **PC**: Prestación Compensatoria (servicios pre-SIJP)
- **PAP**: Prestación Adicional por Permanencia (servicios post-SIJP)
- **Movilidad**: Ajustes trimestrales/mensuales (Leyes 26.417, 27.426, 27.609, DL 274/2024)
- **RIPTE**: Remuneración Imponible Promedio de los Trabajadores Estables
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(affiliates.router, prefix="/api")
app.include_router(liquidations.router, prefix="/api")
app.include_router(ripte.router, prefix="/api")
app.include_router(movilidad.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    """Inicializa la base de datos con datos semilla."""
    db = SessionLocal()
    try:
        from app.models.user import User

        # Crear usuario admin por defecto si no existe
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                email="admin@bluecorp.com",
                username="admin",
                full_name="Administrador Blue Corp",
                role="admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
            )
            db.add(admin)

        if not db.query(User).filter(User.username == "operador1").first():
            op = User(
                email="operador1@bluecorp.com",
                username="operador1",
                full_name="Operador Previsional",
                role="operador",
                hashed_password=get_password_hash("op123456"),
                is_active=True,
            )
            db.add(op)

        db.commit()

        # Cargar datos RIPTE históricos
        from app.models.ripte import TablaRIPTE
        from app.engines.ripte_data import RIPTE_HISTORICO
        if db.query(TablaRIPTE).count() == 0:
            for entry in RIPTE_HISTORICO:
                registro = TablaRIPTE(
                    periodo=entry["periodo"],
                    valor=entry["valor"],
                )
                db.add(registro)
            db.commit()

    finally:
        db.close()


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
