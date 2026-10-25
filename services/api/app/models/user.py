import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="scout")  # scout, coach, analyst, admin
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)

    # Subscription and Payment fields
    subscription_tier = Column(String(50), default="PRO", nullable=False)  # FREE, STARTER, PRO, ACADEMY, ENTERPRISE
    subscription_status = Column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, PAST_DUE, CANCELED
    stripe_customer_id = Column(String(100), nullable=True, index=True)
    paymob_customer_id = Column(String(100), nullable=True, index=True)
    billing_cycle = Column(String(20), default="monthly", nullable=False)  # monthly, annual
    currency = Column(String(10), default="EGP", nullable=False)  # EGP, USD

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
