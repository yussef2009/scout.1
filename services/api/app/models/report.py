import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class ScoutingReport(Base):
    __tablename__ = "scouting_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    match_id = Column(String(36), ForeignKey("match_videos.id", ondelete="SET NULL"), nullable=True, index=True)
    player_id = Column(String(36), ForeignKey("players.id", ondelete="CASCADE"), nullable=True, index=True)
    sport = Column(String(50), nullable=False, default="football", index=True)
    position = Column(String(50), nullable=False)
    position_code = Column(String(20), nullable=True)
    overall_score = Column(Integer, nullable=False)
    overall_grade = Column(String(10), nullable=False)
    potential_rating = Column(Integer, nullable=True, default=85)
    player_summary = Column(String(255), nullable=True)
    one_liner = Column(String(500), nullable=True)
    tags = Column(JSON, default=list)
    metrics = Column(JSON, default=list)
    radar_metrics = Column(JSON, default=dict)
    position_profile = Column(JSON, default=dict)
    playing_time = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    recommended_drills = Column(JSON, default=list)
    narrative = Column(Text, nullable=False)
    pro_comparisons = Column(JSON, default=list)
    kinematics = Column(JSON, nullable=True)
    telemetry = Column(JSON, nullable=True)
    executive_summary = Column(Text, nullable=True)
    tactical_profile = Column(Text, nullable=True)
    volleyball_metrics = Column(JSON, nullable=True)
    volleyball_events = Column(JSON, nullable=True)
    dvw_strings = Column(JSON, nullable=True)
    language = Column(String(10), default="en")
    verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="scouting_reports")
    player = relationship("Player", back_populates="scouting_reports")
    match_video = relationship("MatchVideo", back_populates="scouting_reports")
