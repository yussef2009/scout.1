"""
SCOT AI — MongoDB Atlas Document Models & Schemas
Pydantic v2 schemas for match records, computer vision outputs, and biomechanical telemetry.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


SportType = Literal["volleyball", "football", "basketball"]
ProcessingStatus = Literal["queued", "processing", "completed", "failed"]


class VolleyballTelemetry(BaseModel):
    """
    Biomechanical and tactical telemetry extracted from match video inference.
    """
    peak_jump_height_cm: float = Field(
        default=0.0,
        description="Highest vertical leap achieved across all tracked athletes (cm)",
    )
    max_spike_speed_kmh: float = Field(
        default=0.0,
        description="Peak ball velocity measured during attack/spike actions (km/h)",
    )
    action_counts: Dict[str, int] = Field(
        default_factory=lambda: {
            "serve": 0,
            "spike": 0,
            "block": 0,
            "set": 0,
            "dig": 0,
        },
        description="Total discrete tactical actions classified by YOLOv11 + pose kinematics",
    )
    zone_occupancy: Dict[str, float] = Field(
        default_factory=lambda: {
            "zone_1": 0.0,
            "zone_2": 0.0,
            "zone_3": 0.0,
            "zone_4": 0.0,
            "zone_5": 0.0,
            "zone_6": 0.0,
        },
        description="FIVB standard zones 1-6 player spatial distribution percentages (0.0 - 100.0)",
    )
    heatmap_coordinates: List[Dict[str, float]] = Field(
        default_factory=list,
        description="Normalized 2D court plane coordinates (x: 0-1, y: 0-1) for tactical pitch heatmap",
    )
    total_rallies_tracked: int = Field(
        default=0,
        description="Number of continuous ball in-play sequences detected",
    )
    raw_metrics: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Detailed per-athlete kinematics and frame-level tracking metadata",
    )


class MatchDocument(BaseModel):
    """
    Primary MongoDB Document schema representing a video match analysis session.
    """
    match_id: str = Field(
        ...,
        description="Unique system-wide match session identifier",
        index=True,
    )
    clerk_user_id: str = Field(
        ...,
        description="Clerk authenticated user ID owning this analysis",
        index=True,
    )
    sport_type: SportType = Field(
        default="volleyball",
        description="Sport discipline analyzed by Scot AI Engine",
    )
    status: ProcessingStatus = Field(
        default="queued",
        description="Current asynchronous processing state of the match video",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when video analysis was submitted",
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of the most recent state change",
    )
    raw_video_file_id: Optional[str] = Field(
        default=None,
        description="Appwrite Storage File ID for the original uploaded video",
    )
    annotated_video_url: Optional[str] = Field(
        default=None,
        description="Public Appwrite Storage stream/view URL for the YOLOv11-rendered video",
    )
    telemetry_summary: Optional[VolleyballTelemetry] = Field(
        default=None,
        description="Aggregated tactical and biomechanical telemetry compiled from frames",
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Diagnostic failure reason if processing encountered an error",
    )

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class MatchAnalysisResponse(BaseModel):
    """Response returned upon submission of an analysis job."""
    match_id: str
    clerk_user_id: str
    sport_type: SportType
    status: ProcessingStatus
    created_at: datetime
    message: str


class MatchListResponse(BaseModel):
    """Response returned when fetching all user matches."""
    count: int
    matches: List[MatchDocument]

