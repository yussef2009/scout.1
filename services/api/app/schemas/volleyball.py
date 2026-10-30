from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field, field_validator
from .scouting import ScoutingReportSchema


class VolleyballSkill(str, Enum):
    SERVE = "S"
    RECEPTION = "R"
    SET = "E"
    ATTACK = "A"
    BLOCK = "B"
    DIG = "D"
    FREEBALL = "F"


class VolleyballTempo(str, Enum):
    QUICK = "Q"       # 0.25s - 0.45s (Middle 1-balls, A/C quicks)
    TENSE = "T"       # 0.50s - 0.85s (Fast outside Hut/Go, fast Pipe)
    MEDIUM = "M"      # 0.75s - 0.90s (Controlled tempo, delayed back-row)
    HIGH = "H"        # > 0.90s (Out-of-system high balls)
    OVERPASS = "O"    # Overpass attack or setter dump
    UNKNOWN = "U"


class VolleyballEvaluation(str, Enum):
    PERFECT = "#"     # Ace, Kill, Stuff Block, Perfect Pass/Dig
    POSITIVE = "+"    # Positive touch (in-system)
    MEDIUM = "!"      # Medium touch (pulled off net, middle eliminated)
    POOR = "-"        # Poor touch (high ball only)
    BLOCKED_FAULT = "/" # Blocked, Overpass, Net Fault
    ERROR = "="       # Direct Error (out, antenna, in net)


class VolleyballSubZone(str, Enum):
    FRONT_RIGHT = "A"
    BACK_RIGHT = "B"
    BACK_LEFT = "C"
    FRONT_LEFT = "D"


class VolleyballPositionCode(str, Enum):
    OUTSIDE_HITTER = "OH"
    OPPOSITE = "OPP"
    MIDDLE_BLOCKER = "MB"
    SETTER = "S"
    LIBERO = "L"
    DEFENSIVE_SPECIALIST = "DS"


# Expected Sideout probability weights per reception grade (Module D.2)
EXPECTED_SIDEOUT_WEIGHTS: Dict[VolleyballEvaluation, float] = {
    VolleyballEvaluation.PERFECT: 0.70,
    VolleyballEvaluation.POSITIVE: 0.62,
    VolleyballEvaluation.MEDIUM: 0.53,
    VolleyballEvaluation.POOR: 0.40,
    VolleyballEvaluation.BLOCKED_FAULT: 0.18,
    VolleyballEvaluation.ERROR: 0.00,
}

# Baseline expected attack efficiency by blocker count (Module D.3)
BASELINE_EFF_BY_BLOCKERS: Dict[int, float] = {
    0: 0.75,
    1: 0.48,
    2: 0.26,
    3: 0.08,
}

# Position Skill Weights for Composite 0-100 Rating (Module D.4)
POSITION_WEIGHTS: Dict[str, Dict[str, float]] = {
    "OH": {"attack": 0.35, "pass": 0.30, "dig_set": 0.15, "block": 0.10, "serve": 0.10},
    "OPP": {"attack": 0.55, "serve": 0.15, "block": 0.15, "dig_set": 0.15, "pass": 0.00},
    "MB": {"block": 0.50, "attack": 0.30, "serve": 0.10, "dig_set": 0.10, "pass": 0.00},
    "S": {"dig_set": 0.65, "serve": 0.15, "block": 0.15, "attack": 0.05, "pass": 0.00},
    "L": {"pass": 0.55, "dig_set": 0.45, "attack": 0.00, "block": 0.00, "serve": 0.00},
}


class VolleyballSpatialCoordinates(BaseModel):
    start_zone: Optional[int] = Field(None, ge=1, le=9, description="Starting court zone 1-9")
    end_zone: Optional[int] = Field(None, ge=1, le=9, description="Ending court zone 1-9")
    end_subzone: Optional[VolleyballSubZone] = Field(None, description="Ending subzone quadrant A-D")
    start_xy_meters: Optional[Tuple[float, float]] = Field(None, description="Start coordinates (x, y) in meters on 9x9m half")
    end_xy_meters: Optional[Tuple[float, float]] = Field(None, description="End coordinates (x, y) in meters on 9x9m half")


class VolleyballBiomechanicalMetrics(BaseModel):
    contact_height_m: Optional[float] = Field(None, ge=1.5, le=4.5, description="Ball contact height in meters")
    penultimate_stride_ratio: Optional[float] = Field(None, ge=0.5, le=3.0, description="Stride distance / leg length (opt 1.30-1.65)")
    plant_foot_angle_deg: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Plant foot braking angle (opt 30-45 deg inward)")
    hip_shoulder_separation_deg: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Hip-to-shoulder X-Factor (opt >= 30 deg)")
    split_step_timing_delta_ms: Optional[float] = Field(None, ge=-500.0, le=500.0, description="Split-step landing delta vs opponent contact (opt +-33ms)")
    arm_trunk_abduction_deg: Optional[float] = Field(None, ge=0.0, le=180.0, description="Humerus-to-torso abduction angle (opt 90-110 deg)")
    elbow_above_shoulder: Optional[bool] = Field(None, description="Whether elbow y >= shoulder y during cocking phase")
    block_penetration_cm: Optional[float] = Field(None, ge=-50.0, le=100.0, description="Wrist depth across net plane (opt >= 15 cm)")


class VolleyballEvent(BaseModel):
    match_id: str = Field(..., description="Match identifier, e.g. 'VNL2025-M73-USA-JPN'")
    set: int = Field(..., ge=1, le=5, description="Set number 1-5")
    rally_id: int = Field(..., ge=1, description="Sequential rally index")
    rotation: Optional[int] = Field(None, ge=1, le=6, description="On-court rotation P1-P6")
    dvw_string: Optional[str] = Field(None, description="Standard Data Volley event code, e.g. '*29AH#45D~H2'")
    player_id: str = Field(..., description="Player identifier or jersey string")
    skill: VolleyballSkill = Field(..., description="Skill code S, R, E, A, B, D, F")
    tempo: Optional[VolleyballTempo] = Field(None, description="Tempo code Q, T, M, H, O, U")
    evaluation: VolleyballEvaluation = Field(..., description="6-point touch grade #, +, !, -, /, =")
    expected_sideout_value: Optional[float] = Field(None, ge=0.0, le=1.0, description="Expected Sideout weight [0.0, 1.0]")
    spatial: Optional[VolleyballSpatialCoordinates] = Field(default=None, description="Court zone spatial coordinates")
    biomechanics: Optional[VolleyballBiomechanicalMetrics] = Field(default=None, description="Kinematic pose metrics")

    @field_validator("expected_sideout_value", mode="before")
    @classmethod
    def populate_default_eso(cls, v, values):
        if v is not None:
            return round(float(v), 3)
        return v


class VolleyballPositionMetrics(BaseModel):
    true_attack_efficiency: Optional[float] = Field(None, ge=-1.0, le=1.0, description="True Attack Efficiency Eff_A = (A# - (A= + A/)) / NA")
    pass_expected_sideout: Optional[float] = Field(None, ge=0.0, le=1.0, description="Pass eSO probability [0.0, 1.0]")
    block_adjusted_efficiency: Optional[float] = Field(None, description="Block-Adjusted Hitter Efficiency (BAE)")
    kill_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, description="Direct attack kill percentage")
    ace_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, description="Service ace percentage")
    dig_success_rate: Optional[float] = Field(None, ge=0.0, le=100.0, description="In-system dig rate (# or +)")
    composite_player_rating: Optional[float] = Field(None, ge=0.0, le=100.0, description="Position-weighted rating [0, 100]")


class VolleyballScoutingReport(ScoutingReportSchema):
    volleyballMetrics: Optional[VolleyballPositionMetrics] = Field(
        default=None, description="Volleyball-specific tactical and kinematic metrics"
    )
    volleyballEvents: List[VolleyballEvent] = Field(
        default_factory=list, description="Data Volley touch event stream"
    )
    volleyballBiomechanics: Optional[VolleyballBiomechanicalMetrics] = Field(
        default=None, description="Aggregate biomechanical kinematic indicators"
    )
    dvwStrings: List[str] = Field(
        default_factory=list, description="Chronological Data Volley code strings"
    )


# ==========================================
# MATHEMATICAL & TACTICAL CALCULATION HELPERS
# ==========================================

def calculate_true_attack_efficiency(
    kills: int,
    errors: int,
    blocked: int,
    total_attempts: int,
) -> float:
    """
    Computes True Attack Efficiency (Eff_A) = (A# - (A= + A/)) / NA.
    Bound to [-1.0, 1.0].
    """
    if total_attempts <= 0:
        return 0.0
    eff = (kills - (errors + blocked)) / float(total_attempts)
    return round(max(-1.0, min(1.0, eff)), 3)


def calculate_pass_expected_sideout(
    r_perfect: Any = 0,
    r_positive: int = 0,
    r_medium: int = 0,
    r_poor: int = 0,
    r_overpass: int = 0,
    r_error: int = 0,
) -> float:
    """
    Computes Expected Sideout Pass Rating (Pass eSO) using FIVB/USAV weights:
    (0.70*R# + 0.62*R+ + 0.53*R! + 0.40*R- + 0.18*R/ + 0.00*R=) / NR
    Accepts either a dict of counts (e.g. {"#": 10, "+": 5}) or separate positional counts.
    """
    if isinstance(r_perfect, dict):
        d = r_perfect
        perf = int(d.get("#", d.get("perfect", 0)))
        pos = int(d.get("+", d.get("positive", 0)))
        med = int(d.get("!", d.get("medium", 0)))
        poor = int(d.get("-", d.get("poor", 0)))
        over = int(d.get("/", d.get("overpass", 0)))
        err = int(d.get("=", d.get("error", 0)))
        return calculate_pass_expected_sideout(perf, pos, med, poor, over, err)

    perf = int(r_perfect)
    total_receptions = perf + r_positive + r_medium + r_poor + r_overpass + r_error
    if total_receptions <= 0:
        return 0.0

    weighted_sum = (
        0.70 * perf
        + 0.62 * r_positive
        + 0.53 * r_medium
        + 0.40 * r_poor
        + 0.18 * r_overpass
        + 0.00 * r_error
    )
    eso = weighted_sum / float(total_receptions)
    return round(max(0.0, min(1.0, eso)), 3)


def calculate_block_adjusted_efficiency(
    attack_events: Any = None,
    kills: Optional[int] = None,
    errors: int = 0,
    blocked: int = 0,
    attempts: int = 0,
    blocker_counts: Optional[List[int]] = None,
) -> float:
    """
    Computes Block Adjusted Hitter Efficiency (BAE) against baseline expectations:
    BAE = sum(Actual Outcome_i - E[Outcome | Blockers_i, Tempo_i]) / NA
    Supports both List[VolleyballEvent] and (kills, errors, blocked, attempts, blocker_counts).
    """
    if kills is not None or isinstance(attack_events, (int, float)):
        k = kills if kills is not None else int(attack_events)
        if attempts <= 0:
            return 0.0
        raw_eff = (k - (errors + blocked)) / float(attempts)
        if blocker_counts and len(blocker_counts) > 0:
            expected_avg = sum(BASELINE_EFF_BY_BLOCKERS.get(b, 0.26) for b in blocker_counts) / float(len(blocker_counts))
        else:
            expected_avg = 0.26
        return round(raw_eff - expected_avg, 3)

    if not attack_events:
        return 0.0

    diff_sum = 0.0
    valid_count = 0

    for ev in attack_events:
        if isinstance(ev, dict):
            skill = ev.get("skill")
            eval_val = ev.get("evaluation")
            dvw = ev.get("dvw_string")
        else:
            skill = getattr(ev, "skill", None)
            eval_val = getattr(ev, "evaluation", None)
            dvw = getattr(ev, "dvw_string", None)

        if skill != VolleyballSkill.ATTACK and skill != "A":
            continue

        if eval_val in (VolleyballEvaluation.PERFECT, "#"):
            actual = 1.0
        elif eval_val in (VolleyballEvaluation.POSITIVE, "+"):
            actual = 0.5
        elif eval_val in (VolleyballEvaluation.MEDIUM, "!"):
            actual = 0.2
        elif eval_val in (VolleyballEvaluation.ERROR, "=", VolleyballEvaluation.BLOCKED_FAULT, "/"):
            actual = -1.0
        else:
            actual = 0.0

        num_blockers = 2
        if dvw and "~" in dvw:
            try:
                tag = dvw.split("~")[-1]
                if tag.endswith("1"):
                    num_blockers = 1
                elif tag.endswith("0"):
                    num_blockers = 0
                elif tag.endswith("3"):
                    num_blockers = 3
            except Exception:
                num_blockers = 2

        expected = BASELINE_EFF_BY_BLOCKERS.get(num_blockers, 0.26)
        diff_sum += (actual - expected)
        valid_count += 1

    if valid_count == 0:
        return 0.0
    return round(diff_sum / float(valid_count), 3)


def calculate_composite_rating(
    position_code: str,
    metrics: Dict[str, float],
    means: Optional[Dict[str, float]] = None,
    stds: Optional[Dict[str, float]] = None,
) -> float:
    """
    Computes Composite AI Player Rating (0-100 scale) based on Module D.4:
    Rating = clamp[0, 100](75 + 10 * sum(w_P,k * (Metric_k - mu_k) / sigma_k))
    """
    pos_key = position_code.upper()
    if pos_key in ("SET", "SETTER"):
        pos_key = "S"
    elif pos_key in ("LIB", "LIBERO"):
        pos_key = "L"

    weights = POSITION_WEIGHTS.get(pos_key, POSITION_WEIGHTS["OH"])

    default_means = {"attack": 50.0, "pass": 50.0, "block": 50.0, "serve": 50.0, "dig_set": 50.0}
    default_stds = {"attack": 12.0, "pass": 12.0, "block": 12.0, "serve": 12.0, "dig_set": 12.0}

    mu = means or default_means
    sigma = stds or default_stds

    # Check if metrics are already normalized z-scores (e.g. within [-6, +6])
    is_precomputed_z = (means is None) and len(metrics) > 0 and all(abs(float(v)) <= 6.0 for v in metrics.values())

    z_sum = 0.0
    for skill_key, weight in weights.items():
        if weight <= 0.0:
            continue
        val = float(metrics.get(skill_key, 0.0 if is_precomputed_z else 50.0))
        if is_precomputed_z:
            z = val
        else:
            m = mu.get(skill_key, 50.0)
            s = max(1.0, sigma.get(skill_key, 12.0))
            z = (val - m) / s
        z_sum += weight * z

    rating = 75.0 + 10.0 * z_sum
    return round(max(0.0, min(100.0, rating)), 1)
