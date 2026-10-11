import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CassavaFlow AI"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"
    
    # Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Security
    SECRET_KEY: str = "cassavaflow_secret_key_development_must_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for dev convenience
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://cassavaflow:change_me_locally@localhost:5436/cassavaflow"
    )
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Business Logic Defaults
    GAP_SURPLUS_THRESHOLD_KG: float = 500.0  # Surplus if projected gap > +500kg
    GAP_DEFICIT_THRESHOLD_KG: float = -500.0  # Deficit if projected gap < -500kg
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
