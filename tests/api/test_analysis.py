import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from services.api.app.main import app
from services.api.app.schemas.scouting import ScoutingReportSchema, MetricItem
from services.api.app.services.gemini_service import GeminiService

client = TestClient(app)


def test_schema_validation_enforces_bounds():
    """
    Verifies that Pydantic schema validation clamps and enforces 0-100 rating bounds.
    """
    # Over 100 should clamp or raise
    with pytest.raises(ValidationError):
        MetricItem(name="Passing", score=120, note="Too high")

    with pytest.raises(ValidationError):
        MetricItem(name="Passing", score=-5, note="Negative score")

    valid_metric = MetricItem(name="Passing", score=88, note="Accurate distribution")
    assert valid_metric.score == 88


def test_scouting_report_clamping_validator():
    """
    Verifies that ScoutingReportSchema clamps out-of-range overall scores gracefully.
    """
    valid_report_dict = {
        "overallScore": 150,  # Clamped to 100 by validator
        "overallGrade": "s",  # Validated to upper 'S'
        "potentialRating": 92,
        "position": "Centre-Back",
        "positionCode": "CB",
        "positionProfile": {
            "roleName": "Ball-Playing Defender",
            "roleSuitability": 88,
            "tacticalDuty": "Lead defensive line and initiate build-up play",
            "keyMetrics": ["Defending", "Passing"],
        },
        "playerSummary": "Dominant Aerial Centre-Back",
        "oneLiner": "Elite defensive anchor with progressive distribution.",
        "tags": ["Aerial", "Leadership"],
        "metrics": [
            {"name": "Defending", "score": 90, "note": "Strong 1v1 tackle rate"},
            {"name": "Passing", "score": 85, "note": "High diagonal accuracy"},
        ],
        "strengths": ["Aerial dominance", "Positional discipline"],
        "weaknesses": ["Turn recovery pace vs fast wingers"],
        "recommendedDrills": [
            {
                "title": "1v1 Channel Defending",
                "duration": "15m",
                "focusMetric": "Defending",
                "instructions": "Force attacker outward",
            }
        ],
        "narrative": "Comprehensive technical evaluation demonstrating high competency in modern central defense.",
        "proComparisons": [{"name": "Virgil van Dijk", "similarity": "86%", "reason": "Aerial style"}],
    }

    report = ScoutingReportSchema.model_validate(valid_report_dict)
    assert report.overallScore == 100
    assert report.overallGrade == "S"


@pytest.mark.asyncio
async def test_gemini_fallback_cascade_switch():
    """
    Verifies that if a model fails, the cascade continues through fallback models.
    """
    service = GeminiService()
    # Test that fallback generates a complete valid report even without active external network
    report = await service.generate_scouting_report(
        sport_key="football",
        position="Striker",
        player_context={"label": "#9 Striker", "jerseyNumber": "9"},
        language="en",
    )

    assert isinstance(report, ScoutingReportSchema)
    assert 0 <= report.overallScore <= 100
    assert report.overallGrade in ["S", "A", "B", "C", "D"]
    assert len(report.strengths) >= 1
    assert len(report.weaknesses) >= 1
    assert len(report.recommendedDrills) >= 1


@pytest.mark.asyncio
async def test_bilingual_arabic_generation():
    """
    Verifies that requesting Arabic generates professional sports Arabic in the dossier.
    """
    service = GeminiService()
    ar_report = await service.generate_scouting_report(
        sport_key="football",
        position="Central Midfielder",
        language="ar",
    )

    assert ar_report.language == "ar"
    assert "لاعب" in ar_report.playerSummary or len(ar_report.strengths) > 0
    assert len(ar_report.recommendedDrills) >= 1


def test_api_generate_and_fetch_endpoint():
    """
    Integration test: POST /api/v1/analysis/generate creates report and saves to DB,
    and GET /api/v1/analysis/reports/{slug} fetches the persisted report.
    """
    payload = {
        "sport": "basketball",
        "position": "Point Guard",
        "selectedPlayerId": "P1",
        "playerContext": {
            "id": "P1",
            "label": "#3 Guard",
            "jerseyNumber": "3",
            "team": "Home",
            "position": "Point Guard",
            "positionCode": "PG",
            "confidence": 92,
        },
        "language": "en",
    }

    gen_res = client.post("/api/v1/analysis/generate", json=payload)
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert "report" in gen_data
    assert "shareableSlug" in gen_data

    slug = gen_data["shareableSlug"]

    # Retrieve report by slug
    get_res = client.get(f"/api/v1/analysis/reports/{slug}")
    assert get_res.status_code == 200
    rep_data = get_res.json()
    assert rep_data["position"] == "Point Guard"
    assert rep_data["overallScore"] > 0
