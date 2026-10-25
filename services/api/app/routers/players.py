from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.database import get_db
from ..models.player import Player
from ..models.report import ScoutingReport
from ..schemas.player import PlayerListItemSchema, PlayerDetailResponseSchema

router = APIRouter(prefix="/api/v1/players", tags=["Players"])


@router.get("/", response_model=List[PlayerListItemSchema])
def list_players(sport: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Lists players, optionally filtered by sport.
    """
    query = db.query(Player)
    if sport:
        query = query.filter(Player.primary_sport == sport.lower())
    players = query.order_by(Player.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "slug": p.slug,
            "name": f"{p.first_name} {p.last_name}".strip(),
            "sport": p.primary_sport,
            "position": p.primary_position,
            "jerseyNumber": p.jersey_number,
            "teamColor": p.team_color,
            "thumbnailUrl": p.thumbnail_url,
            "createdAt": p.created_at.isoformat() if p.created_at else None,
        }
        for p in players
    ]


@router.get("/{slug}", response_model=PlayerDetailResponseSchema)
def get_player_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Returns verified longitudinal player profile and historical match reports.
    """
    player = db.query(Player).filter(Player.slug == slug).first()
    if not player:
        # If player not directly found, check if slug belongs to a report
        report = db.query(ScoutingReport).filter(ScoutingReport.slug == slug).first()
        if report:
            return {
                "player": {
                    "id": report.id,
                    "slug": report.slug,
                    "name": report.player_summary or "Athlete Profile",
                    "sport": report.sport,
                    "position": report.position,
                    "positionCode": report.position_code,
                    "teamColor": "#6366f1",
                    "overallScore": report.overall_score,
                    "overallGrade": report.overall_grade,
                    "potentialRating": report.potential_rating,
                },
                "latestReport": {
                    "id": report.id,
                    "slug": report.slug,
                    "overallScore": report.overall_score,
                    "overallGrade": report.overall_grade,
                    "oneLiner": report.one_liner,
                    "narrative": report.narrative,
                    "radarMetrics": report.radar_metrics,
                    "strengths": report.strengths,
                    "weaknesses": report.weaknesses,
                    "recommendedDrills": report.recommended_drills,
                    "kinematics": report.kinematics,
                    "createdAt": report.created_at.isoformat() if report.created_at else None,
                },
                "matchHistory": [
                    {
                        "reportId": report.id,
                        "slug": report.slug,
                        "overallScore": report.overall_score,
                        "grade": report.overall_grade,
                        "position": report.position,
                        "date": report.created_at.strftime("%Y-%m-%d") if report.created_at else "2026-10-24",
                    }
                ],
            }
        raise HTTPException(status_code=404, detail="Player not found")

    reports = db.query(ScoutingReport).filter(ScoutingReport.player_id == player.id).order_by(ScoutingReport.created_at.desc()).all()
    latest = reports[0] if reports else None

    return {
        "player": {
            "id": player.id,
            "slug": player.slug,
            "name": f"{player.first_name} {player.last_name}".strip(),
            "sport": player.primary_sport,
            "position": player.primary_position,
            "jerseyNumber": player.jersey_number,
            "teamColor": player.team_color,
            "thumbnailUrl": player.thumbnail_url,
            "nationality": player.nationality,
            "dateOfBirth": player.date_of_birth,
        },
        "latestReport": {
            "id": latest.id,
            "slug": latest.slug,
            "overallScore": latest.overall_score,
            "overallGrade": latest.overall_grade,
            "oneLiner": latest.one_liner,
            "narrative": latest.narrative,
            "radarMetrics": latest.radar_metrics,
            "strengths": latest.strengths,
            "weaknesses": latest.weaknesses,
            "recommendedDrills": latest.recommended_drills,
            "kinematics": latest.kinematics,
            "createdAt": latest.created_at.isoformat() if latest.created_at else None,
        } if latest else None,
        "matchHistory": [
            {
                "reportId": r.id,
                "slug": r.slug,
                "overallScore": r.overall_score,
                "grade": r.overall_grade,
                "position": r.position,
                "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "2026-10-24",
            }
            for r in reports
        ],
    }
