"""
SCOT AI — Production Observability Layer
Integrates Sentry APM & Error Tracking with Datadog Metrics & Distributed Tracing.
"""

import logging
import os
from typing import Any, Dict, Optional

from datadog import initialize as init_datadog, statsd
import ddtrace
from ddtrace import tracer
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from .config import settings

logger = logging.getLogger("scot_ai.observability")


def setup_observability() -> None:
    """
    Initializes both Sentry and Datadog tracing/metrics integrations on app bootstrap.
    Must be called before the FastAPI application instance is created.
    """
    # ── 1. Sentry APM & Exception Tracking ────────────────────────────────────
    if settings.SENTRY_DSN:
        try:
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                environment=settings.DD_ENV,
                release=f"{settings.DD_SERVICE}@{settings.DD_VERSION}",
                traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
                profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
                integrations=[
                    FastApiIntegration(),
                    StarletteIntegration(),
                ],
                send_default_pii=False,
                attach_stacktrace=True,
            )
            logger.info("Initialized Sentry APM with environment: %s", settings.DD_ENV)
        except Exception as exc:
            logger.warning("Failed to initialize Sentry: %s", exc)
    else:
        logger.info("SENTRY_DSN not configured. Sentry tracking is disabled.")

    # ── 2. Datadog APM Tracer & DogStatsD ─────────────────────────────────────
    try:
        # Configure DogStatsD client for custom AI inference metrics
        init_datadog(
            statsd_host=os.getenv("DD_AGENT_HOST", settings.DD_AGENT_HOST),
            statsd_port=int(os.getenv("DD_DOGSTATSD_PORT", settings.DD_STATSD_PORT)),
            api_key=settings.DD_API_KEY or None,
            statsd_constant_tags=[
                f"env:{settings.DD_ENV}",
                f"service:{settings.DD_SERVICE}",
                f"version:{settings.DD_VERSION}",
            ],
        )

        # Configure ddtrace distributed tracer
        ddtrace.config.service = settings.DD_SERVICE
        ddtrace.config.env = settings.DD_ENV
        ddtrace.config.version = settings.DD_VERSION

        logger.info(
            "Initialized Datadog APM & StatsD client (service=%s, env=%s, site=%s)",
            settings.DD_SERVICE,
            settings.DD_ENV,
            settings.DD_SITE,
        )
    except Exception as exc:
        logger.warning("Could not initialize Datadog APM: %s", exc)


def set_sentry_user_context(clerk_user_id: str, extra: Optional[Dict[str, Any]] = None) -> None:
    """Attaches the active Clerk user ID and metadata to the active Sentry scope."""
    if not settings.SENTRY_DSN:
        return
    try:
        sentry_sdk.set_user({"id": clerk_user_id})
        if extra:
            for k, v in extra.items():
                sentry_sdk.set_extra(k, v)
    except Exception:
        pass


def capture_exception_with_context(
    exc: Exception,
    clerk_user_id: Optional[str] = None,
    match_id: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """Captures unhandled exceptions to Sentry annotated with user & match context."""
    logger.error("Exception in match processing: %s", exc, exc_info=True)
    if not settings.SENTRY_DSN:
        return

    with sentry_sdk.push_scope() as scope:
        if clerk_user_id:
            scope.set_user({"id": clerk_user_id})
        if match_id:
            scope.set_tag("match_id", match_id)
        if extra:
            for k, v in extra.items():
                scope.set_extra(k, v)
        sentry_sdk.capture_exception(exc)


def log_ai_metrics(
    sport: str,
    fps: float,
    avg_conf: float,
    duration_sec: float,
    match_id: Optional[str] = None,
) -> None:
    """
    Emits custom high-resolution telemetry gauges and counters to Datadog DogStatsD:
      - scot_ai.inference.fps
      - scot_ai.model.confidence
      - scot_ai.processing.duration_sec
      - scot_ai.matches.completed
    """
    tags = [
        f"sport:{sport}",
        f"env:{settings.DD_ENV}",
        f"service:{settings.DD_SERVICE}",
    ]
    if match_id:
        tags.append(f"match_id:{match_id}")

    try:
        # Metric 1: Real-time inference frame processing rate (FPS)
        statsd.gauge("scot_ai.inference.fps", max(0.0, float(fps)), tags=tags)

        # Metric 2: Mean detection confidence score (0.0 - 1.0)
        statsd.gauge("scot_ai.model.confidence", max(0.0, min(1.0, float(avg_conf))), tags=tags)

        # Metric 3: Total end-to-end video processing latency in seconds
        statsd.gauge("scot_ai.processing.duration_sec", max(0.0, float(duration_sec)), tags=tags)
        statsd.histogram("scot_ai.processing.duration_histogram", max(0.0, float(duration_sec)), tags=tags)

        # Metric 4: Completed analysis counter
        statsd.increment("scot_ai.matches.completed", value=1, tags=tags)

        logger.info(
            "Emitted Datadog metrics: sport=%s, fps=%.1f, conf=%.2f, duration=%.2fs",
            sport,
            fps,
            avg_conf,
            duration_sec,
        )
    except Exception as exc:
        logger.warning("Could not dispatch metrics to Datadog StatsD: %s", exc)

