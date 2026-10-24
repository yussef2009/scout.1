from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field, field_validator


class PositionProfile(BaseModel):
    roleName: str = Field(..., description="Specific tactical style, e.g. 'Inverted Winger' or 'Floor General'")
    roleSuitability: int = Field(..., ge=0, le=100, description="Suitability score for this position 0-100")
    tacticalDuty: str = Field(..., description="Summary of how effectively positional duties were executed")
    keyMetrics: List[str] = Field(default_factory=list, description="Primary metrics for this position")


class MetricItem(BaseModel):
    name: str = Field(..., description="Name of the metric evaluated")
    score: int = Field(..., ge=0, le=100, description="Metric score from 0-100 (0 if not observed/applicable)")
    note: str = Field(..., description="Visual evidence and observation notes")


class RecommendedDrill(BaseModel):
    title: str = Field(..., description="Drill or training exercise title")
    duration: str = Field(..., description="Recommended duration and frequency, e.g. '15 mins, 3x/week'")
    focusMetric: str = Field(..., description="The primary KPI or metric targeted by this drill")
    instructions: str = Field(..., description="Actionable step-by-step coaching guidance")


class ProComparison(BaseModel):
    name: str = Field(..., description="Elite professional player in same position")
    similarity: str = Field(..., description="Similarity percentage, e.g. '88%'")
    reason: str = Field(..., description="Technical or tactical stylistic justification")
    emoji: Optional[str] = Field(default="⭐", description="Flag or player emoji")


class KinematicsData(BaseModel):
    hangTimeSeconds: float = Field(default=0.0, ge=0.0, description="Airtime duration in seconds")
    peakVerticalCm: int = Field(default=0, ge=0, le=200, description="Peak hip center vertical leap in cm")
    takeoffQualityScore: int = Field(default=0, ge=0, le=100, description="Takeoff kinetic chain score 0-100")
    landingMechanicsRating: Literal["Optimal", "Acceptable", "High Risk", "Not Observed"] = Field(
        default="Not Observed", description="Landing force dissipation and knee flexion rating"
    )
    groundContactTimeMs: Optional[int] = Field(default=None, description="Ground contact time in ms")
    keyBiomechanicalNote: str = Field(default="", description="Key biomechanical critique")


class ExchangeEvent(BaseModel):
    time: str = Field(..., description="Timestamp of substitution/exchange, e.g. '02:15'")
    action: Literal["IN", "OUT"] = Field(..., description="Player entry or exit")
    type: Optional[str] = Field(default="Tactical", description="Exchange type")
    detail: Optional[str] = Field(default="", description="Observation details")


class PlayingTimeAnalysis(BaseModel):
    minutesPlayed: str = Field(default="Full Match", description="Time athlete was active")
    percentageOnField: int = Field(default=100, ge=0, le=100, description="Percentage of observed footage")
    pointsScoredOrInvolved: Optional[str] = Field(default="", description="Points or scoring impact")
    subStatus: Optional[str] = Field(default="Active", description="Starter or substitution status")
    exchanges: List[ExchangeEvent] = Field(default_factory=list, description="Substitutions observed")
    tacticalImpactSummary: str = Field(default="", description="Impact on team performance")


class ScoutingReportSchema(BaseModel):
    overallScore: int = Field(..., ge=0, le=100, description="Composite scouting score from 0 to 100")
    overallGrade: Literal["S", "A", "B", "C", "D"] = Field(..., description="Letter tier grade")
    potentialRating: Optional[int] = Field(default=85, ge=0, le=100, description="Projected developmental ceiling 0-100")
    position: str = Field(..., description="Evaluated tactical position label")
    positionCode: str = Field(default="", description="Standard position code, e.g. 'ST', 'PG', 'LIB'")
    positionProfile: PositionProfile = Field(..., description="Tactical position profile")
    playingTime: Optional[PlayingTimeAnalysis] = Field(default=None, description="Playing time and rotation metrics")
    playerSummary: str = Field(..., description="Headline describing the athlete, e.g. 'Explosive Box-to-Box Midfielder'")
    oneLiner: str = Field(..., description="Concise high-impact scouting verdict")
    tags: List[str] = Field(default_factory=list, description="3-5 athletic tag labels")
    metrics: List[MetricItem] = Field(..., description="Granular metric grades and notes")
    radarMetrics: Optional[Dict[str, float]] = Field(default_factory=dict, description="Normalized 0-100 radar scores")
    executiveSummary: Optional[str] = Field(default="", description="High-level summary of report")
    tacticalProfile: Optional[str] = Field(default="", description="Overview of tactical discipline")
    strengths: List[str] = Field(..., min_length=1, description="Observable key strengths from footage")
    weaknesses: List[str] = Field(..., min_length=1, description="Observable development areas from footage")
    recommendedDrills: List[RecommendedDrill] = Field(..., description="3 tailored corrective coaching drills")
    narrative: str = Field(..., min_length=20, description="In-depth 3-paragraph professional scouting report")
    proComparisons: List[ProComparison] = Field(default_factory=list, description="Pro athlete comparisons")
    comparableProPlayer: Optional[str] = Field(default=None, description="Top comparable pro player")
    kinematics: Optional[KinematicsData] = Field(default=None, description="Vertical leap and jump biomechanics")
    telemetry: Optional[Dict] = Field(default=None, description="Kinematic and speed telemetry")
    language: Optional[Literal["en", "ar"]] = Field(default="en", description="Report language")

    @field_validator("overallScore", "potentialRating", mode="before")
    @classmethod
    def clamp_rating(cls, v):
        if v is None:
            return 80
        try:
            val = int(v)
            return max(0, min(100, val))
        except (ValueError, TypeError):
            return 75

    @field_validator("overallGrade", mode="before")
    @classmethod
    def validate_grade(cls, v):
        if str(v).upper() in ["S", "A", "B", "C", "D"]:
            return str(v).upper()
        return "B"
