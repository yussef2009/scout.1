from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from .scouting import ScoutingReportSchema
from .player import DetectedPlayerSchema, PlayerTelemetrySchema


class DetectPlayersRequest(BaseModel):
    videoId: Optional[str] = Field(default=None, description="Uploaded video ID")
    videoUrl: Optional[str] = Field(default=None, description="Direct URL of the video")
    framesBase64: Optional[List[str]] = Field(default_factory=list, description="Base64 encoded sampled keyframes")
    sport: str = Field(default="football", description="Sport key e.g. football, basketball")


class DetectPlayersResponse(BaseModel):
    playerCount: int
    isSinglePlayer: bool
    players: List[DetectedPlayerSchema]
    scanSource: str = Field(default="hybrid_cv_gemini", description="Detection method used")


class GenerateAnalysisRequest(BaseModel):
    videoId: Optional[str] = Field(default=None, description="Video identifier")
    videoUrl: Optional[str] = Field(default=None, description="Direct or presigned video URL")
    selectedPlayerId: Optional[str] = Field(default=None, description="Target player ID e.g. 'P1'")
    playerContext: Optional[DetectedPlayerSchema] = Field(default=None, description="Target athlete metadata")
    sport: str = Field(default="football", description="Sport identifier")
    position: Optional[str] = Field(default=None, description="Target tactical position")
    language: str = Field(default="en", description="'en' for English or 'ar' for Arabic")
    telemetry: Optional[PlayerTelemetrySchema] = Field(default=None, description="Kinematic telemetry")
    framesBase64: Optional[List[str]] = Field(default_factory=list, description="Sampled keyframes")


class GenerateAnalysisResponse(BaseModel):
    report: ScoutingReportSchema
    reportId: str
    shareableSlug: str
    shareableUrl: str
    cached: bool = False
