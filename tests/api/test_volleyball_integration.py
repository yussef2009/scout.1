import os
import sys
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

# Ensure services/cv-worker is on sys.path
cv_worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../services/cv-worker"))
if cv_worker_path not in sys.path:
    sys.path.insert(0, cv_worker_path)

from services.api.app.main import app
from services.api.app.schemas.volleyball import (
    VolleyballEvent,
    VolleyballSkill,
    VolleyballEvaluation,
    VolleyballTempo,
    VolleyballSubZone,
    VolleyballPositionCode,
    VolleyballSpatialCoordinates,
    VolleyballBiomechanicalMetrics,
    VolleyballPositionMetrics,
    VolleyballScoutingReport,
    calculate_true_attack_efficiency,
    calculate_pass_expected_sideout,
    calculate_block_adjusted_efficiency,
    calculate_composite_rating,
)
from worker.homography import volleyball_homography
from worker.biomechanics import volleyball_biomechanics
from services.api.app.services.gemini_service import gemini_service

client = TestClient(app)


def test_volleyball_event_schema_validation():
    """Verifies strict validation of VolleyballEvent schema matching Data Volley syntax."""
    event = VolleyballEvent(
        match_id="VNL2025-USA-JPN",
        set=1,
        rally_id=14,
        rotation=2,
        dvw_string="*14AQ#41D~H2",
        player_id="14",
        skill=VolleyballSkill.ATTACK,
        tempo=VolleyballTempo.QUICK,
        evaluation=VolleyballEvaluation.PERFECT,
        expected_sideout_value=0.70,
        spatial=VolleyballSpatialCoordinates(
            start_zone=4,
            end_zone=1,
            end_subzone=VolleyballSubZone.FRONT_LEFT,
            start_xy_meters=(1.5, 1.2),
            end_xy_meters=(7.5, 7.8),
        ),
        biomechanics=VolleyballBiomechanicalMetrics(
            contact_height_m=3.45,
            penultimate_stride_ratio=1.52,
            plant_foot_angle_deg=38.0,
        ),
    )
    assert event.skill == "A"
    assert event.evaluation == "#"
    assert event.tempo == "Q"
    assert event.expected_sideout_value == 0.70
    assert event.spatial.start_zone == 4
    assert event.biomechanics.penultimate_stride_ratio == 1.52

    # Validation errors on invalid zones or out-of-range ESO
    with pytest.raises(ValidationError):
        VolleyballEvent(
            match_id="VNL2025-M01",
            set=6,  # max is 5
            rally_id=1,
            player_id="1",
            skill=VolleyballSkill.ATTACK,
            evaluation=VolleyballEvaluation.PERFECT,
        )

    with pytest.raises(ValidationError):
        VolleyballSpatialCoordinates(start_zone=12)  # must be 1-9


def test_volleyball_mathematical_helpers():
    """Verifies Module D statistical metrics: Eff_A, Pass eSO, BAE, and Composite Rating."""
    # 1. True Attack Efficiency (Eff_A) = (A# - (A= + A/)) / NA
    # 15 kills, 3 errors, 2 blocked in 25 attempts -> (15 - 5) / 25 = 0.40
    eff_a = calculate_true_attack_efficiency(kills=15, errors=3, blocked=2, total_attempts=25)
    assert eff_a == 0.40
    assert calculate_true_attack_efficiency(0, 0, 0, 0) == 0.0

    # 2. Pass Expected Sideout (Pass eSO)
    # 10 Perfect (# -> 0.70), 10 Positive (+ -> 0.62) in 20 passes
    # Total = (10 * 0.70 + 10 * 0.62) / 20 = 13.2 / 20 = 0.66
    counts = {"#": 10, "+": 10, "!": 0, "-": 0, "/": 0, "=": 0}
    eso = calculate_pass_expected_sideout(counts)
    assert eso == 0.66

    # 3. Block-Adjusted Hitter Efficiency (BAE)
    # 10 kills against 2 blockers (expected 0.26)
    bae = calculate_block_adjusted_efficiency(
        kills=10,
        errors=2,
        blocked=1,
        attempts=20,
        blocker_counts=[2] * 20,
    )
    # raw_eff = (10 - 3) / 20 = 0.35, expected = 0.26, delta = +0.09
    assert bae == 0.09

    # 4. Composite 0-100 Rating
    z_scores_oh = {"attack": 1.5, "pass": 1.2, "dig_set": 0.5, "block": 0.2, "serve": 0.8}
    comp_oh = calculate_composite_rating("OH", z_scores_oh)
    assert 75.0 <= comp_oh <= 95.0

    comp_libero = calculate_composite_rating("L", {"pass": 2.0, "dig_set": 1.5})
    assert comp_libero >= 80.0


def test_volleyball_spatial_homography():
    """Verifies Module A spatial court geometry: Zones 1-9, Subzones A-D, Setter Target Box."""
    # Front Row
    assert volleyball_homography.resolve_fivb_zone(1.5, 1.5) == 4  # Left Front
    assert volleyball_homography.resolve_fivb_zone(4.5, 1.5) == 3  # Middle Front
    assert volleyball_homography.resolve_fivb_zone(7.5, 1.5) == 2  # Right Front

    # Mid-Back Row
    assert volleyball_homography.resolve_fivb_zone(1.5, 4.5) == 7  # Left Mid Back
    assert volleyball_homography.resolve_fivb_zone(4.5, 4.5) == 8  # Center Mid Back
    assert volleyball_homography.resolve_fivb_zone(7.5, 4.5) == 9  # Right Mid Back

    # Deep Back Row
    assert volleyball_homography.resolve_fivb_zone(1.5, 7.5) == 5  # Left Deep Back
    assert volleyball_homography.resolve_fivb_zone(4.5, 7.5) == 6  # Middle Deep Back
    assert volleyball_homography.resolve_fivb_zone(7.5, 7.5) == 1  # Right Deep Back

    # Subzone Quadrants A-D (1.5m x 1.5m)
    # Inside Zone 4 (0-3m, 0-3m):
    assert volleyball_homography.resolve_subzone(2.0, 0.5) == "A"  # x_rel >= 1.5, y_rel < 1.5
    assert volleyball_homography.resolve_subzone(2.0, 2.0) == "B"  # x_rel >= 1.5, y_rel >= 1.5
    assert volleyball_homography.resolve_subzone(0.5, 2.0) == "C"  # x_rel < 1.5, y_rel >= 1.5
    assert volleyball_homography.resolve_subzone(0.5, 0.5) == "D"  # x_rel < 1.5, y_rel < 1.5

    # Setter Target Box: x in [5.2m, 6.8m], y in [0.5m, 1.8m]
    assert volleyball_homography.is_in_setter_target_box(6.0, 1.2) is True
    assert volleyball_homography.is_in_setter_target_box(2.0, 4.0) is False

    # Deterministic Pass Evaluation
    assert volleyball_homography.evaluate_pass_landing(6.0, 1.2) == "#"  # Inside target box
    assert volleyball_homography.evaluate_pass_landing(4.0, 2.5) == "+"  # Front court
    assert volleyball_homography.evaluate_pass_landing(4.0, 3.8) == "!"  # 3m line medium
    assert volleyball_homography.evaluate_pass_landing(4.0, 6.0) == "-"  # Deep out of system
    assert volleyball_homography.evaluate_pass_landing(4.0, -0.4) == "/"  # Overpass across net
    assert volleyball_homography.evaluate_pass_landing(10.0, 5.0) == "="  # Out of bounds


def test_volleyball_biomechanics_kinematics():
    """Verifies Module E kinematic rules: Penultimate stride, plant foot angle, arm abduction."""
    # 1. Penultimate Stride (1.30 - 1.65 ratio)
    stride_res = volleyball_biomechanics.calculate_penultimate_stride_ratio(
        lead_heel=(100.0, 200.0),
        trail_toe=(248.0, 200.0),
        leg_length_px=100.0,
    )
    assert stride_res["penultimate_stride_ratio"] == 1.48
    assert stride_res["is_optimal"] is True

    # 2. Plant Foot Braking Angle (30° - 45° inward)
    plant_res = volleyball_biomechanics.calculate_plant_foot_angle(
        heel_point=(100.0, 200.0),
        toe_point=(125.0, 168.0),
        approach_vector=(0.0, -1.0),
    )
    assert 30.0 <= plant_res["plant_foot_angle_deg"] <= 45.0
    assert plant_res["is_optimal"] is True

    # 3. Arm Abduction (90° - 110°) and High Elbow Draw
    arm_res = volleyball_biomechanics.calculate_hitting_arm_angles(
        hip=(100.0, 150.0),
        shoulder=(100.0, 80.0),
        elbow=(165.0, 75.0),
        wrist=(180.0, 20.0),
    )
    assert arm_res["elbow_above_shoulder"] is True
    assert arm_res["arm_trunk_abduction_deg"] >= 80.0

    # 4. Split-step timing delta
    split_res = volleyball_biomechanics.calculate_split_step_metrics(
        foot_land_time_ms=515.0,
        opponent_contact_time_ms=500.0,
        left_ankle=(100.0, 200.0),
        right_ankle=(180.0, 200.0),
        left_shoulder=(110.0, 100.0),
        right_shoulder=(160.0, 100.0),
    )
    assert split_res["split_step_timing_delta_ms"] == 15.0
    assert split_res["is_timing_optimal"] is True


@pytest.mark.asyncio
async def test_gemini_service_volleyball_report_generation():
    """Verifies gemini_service generates an authentic VolleyballScoutingReport with DVW event stream."""
    report = await gemini_service.generate_scouting_report(
        sport_key="volleyball",
        position="Outside Hitter",
        player_context={"positionCode": "OH", "jerseyNumber": "14", "label": "#14 USA"},
    )

    assert isinstance(report, VolleyballScoutingReport)
    assert report.overallScore >= 80
    assert report.volleyballMetrics is not None
    assert report.volleyballMetrics.true_attack_efficiency is not None
    assert report.volleyballMetrics.pass_expected_sideout is not None
    assert len(report.volleyballEvents) >= 3
    assert len(report.dvwStrings) >= 3
    assert any("*14" in dvw for dvw in report.dvwStrings)


@pytest.mark.asyncio
async def test_gemini_service_volleyball_squad_discovery():
    """Verifies volleyball athlete detection captures the full squad across both teams (12+ players)."""
    players = await gemini_service.detect_players(sport_key="volleyball")
    assert len(players) >= 12

    positions = {p.positionCode for p in players}
    assert "OH" in positions
    assert "MB" in positions
    assert "S" in positions
    assert "OPP" in positions
    assert "L" in positions

    # Check that both teams are represented
    teams = {p.team for p in players}
    assert len(teams) >= 2


def test_analysis_router_volleyball_e2e():
    """Verifies POST /api/v1/analysis/generate and GET /api/v1/analysis/reports/{slug} for volleyball."""
    payload = {
        "sport": "volleyball",
        "position": "Outside Hitter",
        "playerContext": {
            "id": "P1",
            "trackId": 1,
            "label": "#14 USA (Outside Hitter)",
            "jerseyNumber": "14",
            "team": "USA",
            "teamColorHex": "#2563eb",
            "position": "Outside Hitter",
            "positionCode": "OH",
            "roleCategory": "Attacker",
            "confidence": 95,
        },
        "language": "en",
    }

    # 1. Generate Report
    resp = client.post("/api/v1/analysis/generate", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "report" in data
    assert data["report"]["position"] == "Outside Hitter"
    assert "volleyballMetrics" in data["report"]
    assert data["report"]["volleyballMetrics"]["true_attack_efficiency"] is not None
    assert len(data["report"]["volleyballEvents"]) > 0

    slug = data["shareableSlug"]

    # 2. Retrieve Report by slug
    get_resp = client.get(f"/api/v1/analysis/reports/{slug}")
    assert get_resp.status_code == 200, get_resp.text
    rep = get_resp.json()
    assert rep["position"] == "Outside Hitter"
    assert "volleyballMetrics" in rep
    assert rep["volleyballMetrics"]["true_attack_efficiency"] is not None
    assert len(rep["volleyballEvents"]) > 0
    assert len(rep["dvwStrings"]) > 0
