import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    SECRET_KEY: str = "scoutai_super_secret_jwt_key_change_in_production_2026"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    DATABASE_URL: str = "postgresql://scout:scoutpass@localhost:5432/scoutai_db"
    SQLITE_FALLBACK: bool = True

    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    STORAGE_MODE: str = "local"  # local | s3 | r2
    LOCAL_UPLOAD_DIR: str = "./uploads"

    # S3 / Cloudflare R2
    S3_ENDPOINT: str = ""
    S3_BUCKET: str = "scoutai-videos"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "auto"
    S3_PUBLIC_DOMAIN: str = ""

    # Gemini AI
    GEMINI_API_KEY: str = ""
    PRIMARY_GEMINI_MODEL: str = "gemini-2.5-flash"
    FALLBACK_GEMINI_MODELS: str = "gemini-2.5-flash-lite,gemini-3.8-flash"

    # Computer Vision
    CV_MODE: str = "lightweight"  # lightweight | full
    YOLO_MODEL: str = "yolo11n.pt"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def fallback_models_list(self) -> List[str]:
        models = [self.PRIMARY_GEMINI_MODEL]
        for m in self.FALLBACK_GEMINI_MODELS.split(","):
            m = m.strip()
            if m and m not in models:
                models.append(m)
        return models

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
