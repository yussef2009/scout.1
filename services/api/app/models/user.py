import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="scout")  # scout, coach, analyst, admin
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)

    # Subscription and Payment fields
    subscription_tier = Column(String(50), default="PRO", nullable=False)  # FREE, STARTER, PRO, ACADEMY, ENTERPRISE
    subscription_status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, PAST_DUE, CANCELED
    stripe_customer_id = Column(String(100), nullable=True, index=True)
    paymob_customer_id = Column(String(100), nullable=True, index=True)
    billing_cycle = Column(String(20), default="monthly", nullable=False)  # monthly, annual
    currency = Column(String(10), default="EGP", nullable=False)  # EGP, USD

    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationship back to Organization
    organization = relationship("Organization", back_populates="users")
