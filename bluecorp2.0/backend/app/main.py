"""
Blue Corp 2.0 — Sistema de Gestión Previsional
================================================
FastAPI backend con motor completo SIPA (Ley 24.241 + modificatorias).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash

# Importar modelos para que SQLAlchemy los registre
from app.models import (
    User, Affiliate, AfiliadoPeriodoLaboral, AfiliadoRemuneracion,
    Liquidacion, ItemLiquidacion, DescuentoVoluntario, Novedad,
    Expediente, MovimientoExpediente, TablaRIPTE, TablaMovilidad, AuditLog
)

from app.api.endpoints import (
    auth, users, affiliates, liquidations, expedientes,
    novedades, ripte, movilidad, reports
)

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Blue Corp 2.0 — Sistema de Gestión Previsional SIPA

### Módulos implementados:
- **Afiliados**: alta, modificación, baja, padrón completo
- **Liquidaciones**: mensual, SAC, retroactivo, recibo PDF
- **Expedientes**: gestión de trámites con historial de movimientos
- **Novedades**: eventos que afectan el haber
- **Descuentos**: PAMI, sindicatos, mutuales, embargos
- **RIPTE**: tabla histórica 2010–2026
- **Movilidad**: coeficientes históricos + simulador
- **Reportes**: dashboard, padrón, estadísticas

### Cálculo previsional (Ley 24.241):
- **PBU** = 2.5 × Haber Mínimo (Art. 19-21)
- **PC** = 1.5% × años_pre_SIJP × PBCI (Art. 23-25)
- **PAP** = 0.85% × años_post_SIJP × PBCI (Art. 30-31)
- **SAC** = 50% × mejor haber semestre (Ley 23.041)
- **Movilidad**: DL 274/2024 (mensual IPC desde 2024)
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api")
app.include_router(users.router,        prefix="/api")
app.include_router(affiliates.router,   prefix="/api")
app.include_router(liquidations.router, prefix="/api")
app.include_router(expedientes.router,  prefix="/api")
app.include_router(novedades.router,    prefix="/api")
app.include_router(ripte.router,        prefix="/api")
app.include_router(movilidad.router,    prefix="/api")
app.include_router(reports.router,      prefix="/api")


@app.on_event("startup")
def seed_database():
    """Datos iniciales (usuarios y RIPTE histórico)."""
    db = SessionLocal()
    try:
        # Usuarios por defecto
        usuarios_seed = [
            {"username": "admin", "email": "admin@bluecorp.com",
             "full_name": "Administrador", "role": "admin", "password": "admin123"},
            {"username": "operador1", "email": "operador1@bluecorp.com",
             "full_name": "Operador Previsional", "role": "operador", "password": "op123456"},
            {"username": "supervisor1", "email": "supervisor1@bluecorp.com",
             "full_name": "Supervisor de Haberes", "role": "supervisor", "password": "sup123456"},
        ]
        for u in usuarios_seed:
            if not db.query(User).filter(User.username == u["username"]).first():
                db.add(User(
                    username=u["username"], email=u["email"],
                    full_name=u["full_name"], role=u["role"],
                    hashed_password=get_password_hash(u["password"]),
                    is_active=True,
                ))

        # RIPTE histórico
        from app.engines.ripte_data import RIPTE_HISTORICO
        if db.query(TablaRIPTE).count() == 0:
            for entry in RIPTE_HISTORICO:
                db.add(TablaRIPTE(periodo=entry["periodo"], valor=entry["valor"]))

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
        "endpoints": {
            "auth": "/api/auth",
            "affiliates": "/api/affiliates",
            "liquidations": "/api/liquidations",
            "expedientes": "/api/expedientes",
            "novedades": "/api/novedades",
            "ripte": "/api/ripte",
            "movilidad": "/api/movilidad",
            "reports": "/api/reports",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
