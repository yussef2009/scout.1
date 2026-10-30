import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(500), nullable=True)
    license_code = Column(String(50), nullable=True)

    # Subscription & Billing Fields
    plan_tier = Column(String(50), default="pro")  # Legacy compatibility: free, starter, pro, academy, enterprise
    subscription_tier = Column(String(50), default="PRO", nullable=False)  # FREE, STARTER, PRO, ACADEMY, ENTERPRISE
    subscription_status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, PAST_DUE, CANCELED, TRIALING
    billing_cycle = Column(String(20), default="monthly", nullable=False)  # monthly, annual
    currency = Column(String(10), default="EGP", nullable=False)  # EGP, USD

    # Gateway Identifiers
    stripe_customer_id = Column(String(100), nullable=True, index=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    paymob_customer_id = Column(String(100), nullable=True, index=True)
    paymob_order_id = Column(String(100), nullable=True)

    # Billing Period Dates (Timezone-aware UTC)
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships with explicit cascading actions
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    players = relationship("Player", back_populates="organization", cascade="all, delete-orphan")
    match_videos = relationship("MatchVideo", back_populates="organization", cascade="all, delete-orphan")
    scouting_reports = relationship("ScoutingReport", back_populates="organization", cascade="all, delete-orphan")
    usage_meters = relationship("UsageMeter", back_populates="organization", cascade="all, delete-orphan")
