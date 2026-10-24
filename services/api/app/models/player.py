import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from .database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    primary_sport = Column(String(50), nullable=False, default="football")
    primary_position = Column(String(50), nullable=True)
    jersey_number = Column(String(10), nullable=True)
    team_name = Column(String(100), nullable=True)
    team_color = Column(String(50), nullable=True, default="#6366f1")
    thumbnail_url = Column(String(500), nullable=True)
    nationality = Column(String(100), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
