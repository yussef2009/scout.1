"""
SCOT AI — Centralized Environment & Application Configuration
Pydantic BaseSettings loader enforcing strict typing and runtime validation.
"""

from functools import lru_cache
import os
from pathlib import Path
from typing import List

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    _USE_PYDANTIC_V2 = True
except ImportError:
    from pydantic import BaseSettings
    _USE_PYDANTIC_V2 = False


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """
    Production settings loader for Scot AI Engine backend service.
    Loads environment variables with fallbacks to local .env configuration.
    """

    # ── General Runtime & Domain Settings ─────────────────────────────────────
    ENV: str = "production"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CUSTOM_DOMAIN: str = "https://your-domain.tech"
    FRONTEND_URL: str = "https://your-domain.tech"
    API_SUBDOMAIN: str = "https://api.your-domain.tech"

    # ── Auth & AI Services ───────────────────────────────────────────────────
    CLERK_SECRET_KEY: str = ""
    ROBOFLOW_API_KEY: str = ""

    # ── MongoDB Atlas ────────────────────────────────────────────────────────
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "scot_ai_db"
    MONGODB_MAX_POOL_SIZE: int = 50
    MONGODB_MIN_POOL_SIZE: int = 10

    # ── Appwrite Cloud Storage ───────────────────────────────────────────────
    APPWRITE_ENDPOINT: str = "https://cloud.appwrite.io/v1"
    APPWRITE_PROJECT_ID: str = ""
    APPWRITE_API_KEY: str = ""
    APPWRITE_BUCKET_ID: str = "scot-match-videos"

    # ── Sentry Observability ─────────────────────────────────────────────────
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0
    SENTRY_PROFILES_SAMPLE_RATE: float = 1.0

    # ── Datadog Telemetry ────────────────────────────────────────────────────
    DD_API_KEY: str = ""
    DD_SITE: str = "datadoghq.com"
    DD_SERVICE: str = "scot-ai-api"
    DD_ENV: str = "production"
    DD_VERSION: str = "2.0.0"
    DD_AGENT_HOST: str = "127.0.0.1"
    DD_STATSD_PORT: int = 8125

    # ── Local Temp Storage Directory for Processing ──────────────────────────
    TEMP_UPLOAD_DIR: str = str(BASE_DIR / "temp_uploads")

    if _USE_PYDANTIC_V2:
        model_config = SettingsConfigDict(
            env_file=str(BASE_DIR / ".env"),
            env_file_encoding="utf-8",
            extra="ignore",
            case_sensitive=True,
        )
    else:
        class Config:
            env_file = str(BASE_DIR / ".env")
            env_file_encoding = "utf-8"
            extra = "ignore"
            case_sensitive = True

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() in ("production", "prod")

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            self.FRONTEND_URL,
            self.CUSTOM_DOMAIN,
            self.API_SUBDOMAIN,
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8443",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8443",
        ]
        # Clean trailing slashes
        return list(set(orig.rstrip("/") for orig in origins if orig))


@lru_cache()
def get_settings() -> Settings:
    """Returns singleton cached instance of Application Settings."""
    return Settings()


settings = get_settings()

