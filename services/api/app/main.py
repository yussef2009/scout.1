import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .models.database import init_db
from .routers import auth, videos, analysis, players, billing

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    os.makedirs(os.path.abspath(settings.LOCAL_UPLOAD_DIR), exist_ok=True)
    yield


app = FastAPI(
    title="ScoutAI 2.0 — Sports Intelligence API",
    description="Production-Grade Multi-Tenant Computer Vision & Scouting Analysis Backend",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(analysis.router)
app.include_router(players.router)
app.include_router(billing.router)


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "scoutai-api",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "storageMode": settings.STORAGE_MODE,
        "cvMode": settings.CV_MODE,
        "primaryGeminiModel": settings.PRIMARY_GEMINI_MODEL,
        "fallbackModels": settings.fallback_models_list,
    }
