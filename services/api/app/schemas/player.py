from typing import List, Optional
from pydantic import BaseModel, Field


class BoundingBoxSchema(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized x coordinate top-left")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized y coordinate top-left")
    w: float = Field(..., ge=0.0, le=1.0, description="Normalized width")
    h: float = Field(..., ge=0.0, le=1.0, description="Normalized height")


class PlayerExchangeSchema(BaseModel):
    time: str
    action: str
    type: Optional[str] = "Substitution"
    description: Optional[str] = ""


class DetectedPlayerSchema(BaseModel):
    id: str = Field(..., description="Unique player identifier, e.g. 'P1'")
    trackId: Optional[int] = Field(default=None, description="ByteTrack persistent tracking ID")
    label: str = Field(..., description="Player label, e.g. '#10 Blue'")
    jerseyNumber: Optional[str] = Field(default="", description="Jersey digits e.g. '10'")
    team: Optional[str] = Field(default="", description="Team or kit name")
    teamColorHex: Optional[str] = Field(default="#6366f1", description="Dominant shirt hex color")
    position: Optional[str] = Field(default="", description="Position label")
    positionCode: Optional[str] = Field(default="", description="Position code e.g. 'ST'")
    roleCategory: Optional[str] = Field(default="Specialist", description="Category e.g. 'Attacker'")
    confidence: int = Field(default=75, ge=0, le=100, description="Detection confidence 0-100")
    description: Optional[str] = Field(default="", description="Visual description")
    standoutTrait: Optional[str] = Field(default="", description="Observable athletic trait")
    emoji: Optional[str] = Field(default="👤", description="Display emoji")
    playingTime: Optional[str] = Field(default="Active", description="Playing time summary")
    pointsOrScore: Optional[str] = Field(default="", description="Points/scoring contribution")
    subStatus: Optional[str] = Field(default="Active", description="Sub status")
    exchanges: List[PlayerExchangeSchema] = Field(default_factory=list)
    boundingBox: Optional[BoundingBoxSchema] = Field(default=None)
    thumbnailBase64: Optional[str] = Field(default=None, description="Player crop thumbnail")


class PlayerTelemetrySchema(BaseModel):
    topSpeedKmh: Optional[float] = Field(default=None, ge=0.0, description="Estimated top speed km/h")
    distanceCoveredMeters: Optional[float] = Field(default=None, ge=0.0, description="Estimated distance in meters")
    sprintCount: Optional[int] = Field(default=None, ge=0, description="Number of sprints > 22 km/h")
    accelerationsCount: Optional[int] = Field(default=None, ge=0, description="High acceleration bursts")
    heatmapGrid: Optional[List[List[float]]] = Field(
        default=None, description="12x8 spatial occupancy matrix"
    )
    keyEventTimestamps: Optional[List[float]] = Field(
        default_factory=list, description="Seconds timestamps of high-motion action events"
    )
