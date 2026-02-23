from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Blue Corp 2.0 — Sistema Previsional"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./bluecorp.db"

    SECRET_KEY: str = "bluecorp-dev-secret-key-2024-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # ── Parámetros previsionales (Ley 24.241 + modificatorias) ──────────
    TASA_PC: float = 0.015        # 1.5% por año pre-SIJP  (Art. 24)
    TASA_PAP: float = 0.0085      # 0.85% por año post-SIJP (Art. 30)
    ANIOS_MIN_APORTES: int = 30
    EDAD_JUBILACION_HOMBRE: int = 65
    EDAD_JUBILACION_MUJER: int = 60
    CORTE_SIJP: str = "1994-07-01"

    # ── Haberes vigentes (Feb 2026 – actualizar cada trimestre) ─────────
    HABER_MINIMO_VIGENTE: float = 370000.0
    HABER_MAXIMO_VIGENTE: float = 1480000.0

    # ── Descuentos obligatorios ──────────────────────────────────────────
    TASA_PAMI: float = 0.03              # Ley 19.032
    TASA_APORTE_PERSONAL: float = 0.11  # 11% aportes SIPA
    TASA_CONTRIBUCION_PATRONAL: float = 0.16  # 16% contribución

    # ── SAC (Sueldo Anual Complementario) ───────────────────────────────
    # Ley 23.041: 50% del mejor haber del semestre, pagado Jun/Dic
    SAC_PORCENTAJE: float = 0.5

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
