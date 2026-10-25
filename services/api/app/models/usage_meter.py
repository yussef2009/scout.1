import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base


class UsageMeter(Base):
    __tablename__ = "usage_meters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    billing_period = Column(String(7), nullable=False, index=True)  # Format: "YYYY-MM" (e.g. "2026-10")

    # Resource consumption counters
    video_uploads_count = Column(Integer, default=0, nullable=False)
    video_duration_minutes = Column(Float, default=0.0, nullable=False)
    ai_reports_count = Column(Integer, default=0, nullable=False)
    players_managed_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="usage_meters")

    __table_args__ = (
        UniqueConstraint("org_id", "billing_period", name="uq_org_billing_period"),
    )
