import uuid
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.database import get_db
from ..models.report import ScoutingReport
from ..models.player import Player
from ..services.gemini_service import gemini_service
from ..services.pdf_service import pdf_service
from ..schemas.analysis import GenerateAnalysisRequest, GenerateAnalysisResponse
from ..schemas.scouting import ScoutingReportSchema

router = APIRouter(prefix="/api/v1/analysis", tags=["Analysis"])


@router.post("/generate", response_model=GenerateAnalysisResponse)
async def generate_analysis(req: GenerateAnalysisRequest, db: Session = Depends(get_db)):
    """
    Orchestrates full tactical analysis using Gemini with Structured Outputs and saves report permanently to DB.
    """
    player_ctx = req.playerContext.model_dump() if req.playerContext else None
    telemetry_dict = req.telemetry.model_dump() if req.telemetry else None

    # Call resilient Gemini service
    report_schema = await gemini_service.generate_scouting_report(
        sport_key=req.sport,
        position=req.position,
        player_context=player_ctx,
        telemetry=telemetry_dict,
        frames_base64=req.framesBase64,
        language=req.language,
    )

    # Generate shareable slug
    player_slug_part = "athlete"
    if req.playerContext and req.playerContext.label:
        player_slug_part = req.playerContext.label.replace("#", "").replace(" ", "-").lower()[:15]
    elif req.position:
        player_slug_part = req.position.replace(" ", "-").lower()[:15]

    short_id = str(uuid.uuid4())[:8]
    shareable_slug = f"{player_slug_part}-{short_id}"

    # Auto-link or create player record if requested
    player_record = None
    if req.selectedPlayerId or (req.playerContext and req.playerContext.label):
        p_name = req.playerContext.label if req.playerContext else f"Player {req.selectedPlayerId}"
        player_record = db.query(Player).filter(Player.slug == shareable_slug).first()
        if not player_record:
            player_record = Player(
                slug=shareable_slug,
                first_name=p_name,
                last_name=f"({req.sport.capitalize()})",
                primary_sport=req.sport,
                primary_position=report_schema.position,
                jersey_number=req.playerContext.jerseyNumber if req.playerContext else None,
                team_color=req.playerContext.teamColorHex if req.playerContext else "#6366f1",
            )
            db.add(player_record)
            db.flush()

    # Save scouting report in database
    db_report = ScoutingReport(
        slug=shareable_slug,
        player_id=player_record.id if player_record else None,
        sport=req.sport,
        position=report_schema.position,
        position_code=report_schema.positionCode,
        overall_score=report_schema.overallScore,
        overall_grade=report_schema.overallGrade,
        potential_rating=report_schema.potentialRating,
        player_summary=report_schema.playerSummary,
        one_liner=report_schema.oneLiner,
        tags=report_schema.tags,
        metrics=[m.model_dump() for m in report_schema.metrics],
        radar_metrics=report_schema.radarMetrics or {},
        position_profile=report_schema.positionProfile.model_dump(),
        playing_time=report_schema.playingTime.model_dump() if report_schema.playingTime else {},
        strengths=report_schema.strengths,
        weaknesses=report_schema.weaknesses,
        recommended_drills=[d.model_dump() for d in report_schema.recommendedDrills],
        narrative=report_schema.narrative,
        pro_comparisons=[p.model_dump() for p in report_schema.proComparisons],
        kinematics=report_schema.kinematics.model_dump() if report_schema.kinematics else None,
        telemetry=telemetry_dict,
        language=req.language,
        verified=True,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Attach ID and slug to output schema
    report_dict = report_schema.model_dump()
    report_dict["id"] = db_report.id
    report_dict["slug"] = db_report.slug
    report_dict["createdAt"] = db_report.created_at.isoformat()
    final_report = ScoutingReportSchema.model_validate(report_dict)

    return GenerateAnalysisResponse(
        report=final_report,
        reportId=db_report.id,
        shareableSlug=db_report.slug,
        shareableUrl=f"/p/{db_report.slug}",
        cached=False,
    )


@router.get("/reports/{slug_or_id}", response_model=ScoutingReportSchema)
def get_report(slug_or_id: str, db: Session = Depends(get_db)):
    """
    Retrieves a persisted scouting report by unique slug or ID.
    """
    report = (
        db.query(ScoutingReport)
        .filter((ScoutingReport.slug == slug_or_id) | (ScoutingReport.id == slug_or_id))
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Scouting report not found")

    return ScoutingReportSchema(
        id=report.id,
        slug=report.slug,
        overallScore=report.overall_score,
        overallGrade=report.overall_grade,
        potentialRating=report.potential_rating,
        position=report.position,
        positionCode=report.position_code or "",
        positionProfile=report.position_profile or {},
        playingTime=report.playing_time or None,
        playerSummary=report.player_summary or "",
        oneLiner=report.one_liner or "",
        tags=report.tags or [],
        metrics=report.metrics or [],
        radarMetrics=report.radar_metrics or {},
        executiveSummary=f"Verified ScoutAI report for {report.position}",
        tacticalProfile="Disciplined positional execution",
        strengths=report.strengths or [],
        weaknesses=report.weaknesses or [],
        recommendedDrills=report.recommended_drills or [],
        narrative=report.narrative,
        proComparisons=report.pro_comparisons or [],
        comparableProPlayer=(report.pro_comparisons[0]["name"] if report.pro_comparisons else None),
        kinematics=report.kinematics,
        telemetry=report.telemetry,
        language=report.language or "en",
        verified=report.verified,
        createdAt=report.created_at.isoformat() if report.created_at else None,
    )


@router.get("/reports/{slug_or_id}/pdf")
def export_report_pdf(slug_or_id: str, db: Session = Depends(get_db)):
    """
    Generates and downloads a branded scouting dossier PDF.
    """
    report_schema = get_report(slug_or_id, db)
    pdf_bytes = pdf_service.generate_scouting_pdf(report_schema, player_name=report_schema.playerSummary[:30])

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ScoutAI_Report_{slug_or_id}.pdf"},
    )
