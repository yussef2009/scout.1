import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from .database import Base


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

    # Billing Period Dates
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to monthly usage meters
    usage_meters = relationship("UsageMeter", back_populates="organization", cascade="all, delete-orphan")
