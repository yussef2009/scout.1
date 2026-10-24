import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float
from .database import Base


class MatchVideo(Base):
    __tablename__ = "match_videos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    video_url = Column(String(1000), nullable=False)
    storage_key = Column(String(500), nullable=True)
    duration_seconds = Column(Float, nullable=True, default=0.0)
    file_size_bytes = Column(Integer, nullable=True, default=0)
    sport = Column(String(50), nullable=False, default="football")
    status = Column(String(50), default="processed")  # uploaded, processing, processed, failed
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
