# ── SCOT AI — Production Containerfile for Azure Container Apps ───────────────
# Base: Python 3.11 Slim with OpenCV & FFmpeg acceleration
FROM python:3.11-slim AS runtime

# Set runtime container environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENV=production \
    DD_SERVICE="scot-ai-api" \
    DD_ENV="production" \
    TEMP_UPLOAD_DIR="/tmp/scot_ai"

# Install system dependencies for OpenCV Headless, FFmpeg video encoding, and health probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python production dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Create temporary upload workspace and configure permissions
RUN mkdir -p /tmp/scot_ai && chmod 777 /tmp/scot_ai

# Copy application source code
COPY . /app

# Create non-root application user for production security compliance
RUN useradd -u 10001 -m -s /bin/bash appuser && \
    chown -R appuser:appuser /app /tmp/scot_ai

USER appuser

# Expose HTTP port for Azure Container Apps ingress
EXPOSE 8000

# Container liveness & readiness health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch FastAPI ASGI server wrapped with Datadog APM tracing
CMD ["ddtrace-run", "uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]

