import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Player(Base):
    __tablename__ = "players"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    primary_sport = Column(String(50), nullable=False, default="football", index=True)
    primary_position = Column(String(50), nullable=True)
    jersey_number = Column(String(10), nullable=True)
    team_name = Column(String(100), nullable=True)
    team_color = Column(String(50), nullable=True, default="#6366f1")
    thumbnail_url = Column(String(500), nullable=True)
    nationality = Column(String(100), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="players")
    scouting_reports = relationship("ScoutingReport", back_populates="player", cascade="all, delete-orphan", passive_deletes=True)

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
