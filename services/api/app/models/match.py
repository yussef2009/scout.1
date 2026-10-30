import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class MatchVideo(Base):
    __tablename__ = "match_videos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    video_url = Column(String(1000), nullable=False)
    storage_key = Column(String(500), nullable=True)
    duration_seconds = Column(Float, nullable=True, default=0.0)
    file_size_bytes = Column(Integer, nullable=True, default=0)
    sport = Column(String(50), nullable=False, default="football", index=True)
    status = Column(String(50), default="processed", index=True)  # uploaded, processing, processed, failed
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="match_videos")
    scouting_reports = relationship("ScoutingReport", back_populates="match_video")
