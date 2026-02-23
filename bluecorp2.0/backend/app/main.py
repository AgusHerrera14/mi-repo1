"""
Blue Corp 2.0 — Herramienta Judicial Previsional
==================================================
FastAPI backend para cálculo previsional judicial (Ley 24.241 + modificatorias).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash

# Importar modelos para que SQLAlchemy los registre
from app.models import (
    User,
    Ficha, Servicio, Remuneracion, CalculoDerecho, CalculoHaber, CalculoReajuste,
)

from app.api.endpoints import auth, users
from app.api.endpoints.fichas import router as fichas_router
from app.api.endpoints.calculos import router as calculos_router
from app.api.endpoints.herramientas import router as herramientas_router

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Blue Corp 2.0 — Herramienta Judicial Previsional

### Módulos implementados:
- **Fichas**: gestión del expediente cliente (causante, servicios, remuneraciones)
- **Cálculo de Derecho**: determina si el causante tiene derecho a la prestación
- **Cálculo de Haber**: PBU + PC + PAP según Ley 24.241
- **Reajuste Judicial**: solo movilidad, Badaro, De Laude
- **Herramientas**: tablas históricas de RIPTE, movilidad, topes, tasas

### Cálculo previsional (Ley 24.241):
- **PBU** = 2.5 × Haber Mínimo (Art. 19-21)
- **PC** = 1.5% × años_pre_SIJP × PBCI (Art. 23-25)
- **PAP** = 0.85% × años_post_SIJP × PBCI (Art. 30-31)
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
app.include_router(fichas_router,       prefix="/api")
app.include_router(calculos_router,     prefix="/api")
app.include_router(herramientas_router, prefix="/api")


@app.on_event("startup")
def seed_database():
    """Datos iniciales (usuarios por defecto)."""
    db = SessionLocal()
    try:
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
            "users": "/api/users",
            "fichas": "/api/fichas",
            "calculos": "/api/calculos",
            "herramientas": "/api/herramientas",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
