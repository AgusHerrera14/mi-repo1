from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Blue Corp - Sistema Previsional"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./bluecorp.db"

    SECRET_KEY: str = "bluecorp-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Argentine pension constants (Law 24.241 + amendments)
    TASA_PC: float = 0.015        # 1.5% por año aportado pre-SIJP (Art. 24)
    TASA_PAP: float = 0.0085      # 0.85% por año aportado post-SIJP (Art. 30)
    ANIOS_MIN_APORTES: int = 30   # Años mínimos de aportes (Art. 19)
    EDAD_JUBILACION_HOMBRE: int = 65
    EDAD_JUBILACION_MUJER: int = 60
    CORTE_SIJP: str = "1994-07-01"  # Fecha de inicio del SIJP

    # Haber mínimo vigente (actualizado trimestralmente)
    HABER_MINIMO_VIGENTE: float = 370000.0  # ARS (referencia Feb 2026)
    HABER_MAXIMO_VIGENTE: float = 1480000.0  # ARS (4x mínimo, referencia)

    class Config:
        env_file = ".env"


settings = Settings()
