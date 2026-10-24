import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Text, Boolean
from .database import Base


class ScoutingReport(Base):
    __tablename__ = "scouting_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    match_id = Column(String(36), ForeignKey("match_videos.id"), nullable=True)
    player_id = Column(String(36), ForeignKey("players.id"), nullable=True)
    sport = Column(String(50), nullable=False, default="football")
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
    language = Column(String(10), default="en")
    verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
