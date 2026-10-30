from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict


class SportPositionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: str
    label: str
    category: str
    primary_metrics: List[str] = Field(alias="primaryMetrics", default_factory=list)
    tactical_notes: str = Field(alias="tacticalNotes", default="")


class SportConfigSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    key: str
    name: str
    emoji: str
    metrics: List[str]
    radar_labels: List[str] = Field(alias="radarLabels")
    benchmark_source: str = Field(alias="benchmarkSource")
    has_kinematics: bool = Field(alias="hasKinematics", default=False)
    position: str
    positions: List[SportPositionSchema]


SPORT_DEFINITIONS: Dict[str, dict] = {
    "football": {
        "key": "football",
        "name": "Football / Soccer",
        "emoji": "⚽",
        "metrics": [
            "Passing",
            "Progressive Carries",
            "Shooting (xG)",
            "Defending",
            "Aerial Duels",
            "PPDA (Pressing)",
            "Pace",
            "Positioning",
        ],
        "radarLabels": ["Passing", "Carries", "Shooting", "Defend", "Aerial", "Pace"],
        "benchmarkSource": "Opta / Stats Perform, Wyscout",
        "position": "Attacker / Midfielder / Defender",
        "positions": [
            {
                "code": "GK",
                "label": "Goalkeeper",
                "category": "Goalkeeper",
                "primaryMetrics": ["Defending", "Positioning", "Passing", "Aerial Duels", "PPDA (Pressing)"],
                "tacticalNotes": "Shot-stopping reflex, box command, distribution accuracy under pressure",
            },
            {
                "code": "CB",
                "label": "Centre-Back",
                "category": "Defender",
                "primaryMetrics": ["Defending", "Aerial Duels", "Positioning", "Passing", "PPDA (Pressing)"],
                "tacticalNotes": "1v1 tackle win %, aerial duel dominance, defensive line leadership",
            },
            {
                "code": "FB",
                "label": "Full-Back / Wing-Back (LB/RB)",
                "category": "Defender",
                "primaryMetrics": ["Pace", "Passing", "Progressive Carries", "Defending", "PPDA (Pressing)"],
                "tacticalNotes": "Overlapping flank runs, crossing quality, recovery pace",
            },
            {
                "code": "CDM",
                "label": "Defensive Midfielder",
                "category": "Midfielder",
                "primaryMetrics": ["Defending", "PPDA (Pressing)", "Passing", "Positioning", "Aerial Duels"],
                "tacticalNotes": "Screening back line, interception rate, PPDA pressing load",
            },
            {
                "code": "CM",
                "label": "Central Midfielder",
                "category": "Midfielder",
                "primaryMetrics": ["Passing", "Progressive Carries", "Positioning", "PPDA (Pressing)", "Defending"],
                "tacticalNotes": "Box-to-box circulation, progressive pass volume, spatial awareness",
            },
            {
                "code": "CAM",
                "label": "Attacking Midfielder",
                "category": "Midfielder",
                "primaryMetrics": ["Shooting (xG)", "Passing", "Progressive Carries", "Positioning", "Pace"],
                "tacticalNotes": "xG creation, key pass in final third, pockets of space between lines",
            },
            {
                "code": "WG",
                "label": "Winger (LW/RW)",
                "category": "Attacker",
                "primaryMetrics": ["Pace", "Progressive Carries", "Shooting (xG)", "Passing", "Defending"],
                "tacticalNotes": "1v1 dribble success rate, explosive carries, xG contribution",
            },
            {
                "code": "ST",
                "label": "Striker / Forward",
                "category": "Attacker",
                "primaryMetrics": ["Shooting (xG)", "Positioning", "Pace", "Aerial Duels", "Progressive Carries"],
                "tacticalNotes": "xG finishing efficiency, penalty box instincts, aerial hold-up",
            },
        ],
    },
    "basketball": {
        "key": "basketball",
        "name": "Basketball",
        "emoji": "🏀",
        "metrics": [
            "Shooting (eFG%)",
            "True Shooting (TS%)",
            "Ball Handling",
            "Passing (PPP)",
            "Defense",
            "Vertical Jump",
            "Rebounding",
            "Basketball IQ",
        ],
        "radarLabels": ["eFG%", "TS%", "Handles", "Passing", "Defense", "IQ"],
        "benchmarkSource": "Synergy Sports, NBA Second Spectrum",
        "hasKinematics": True,
        "position": "Guard / Forward / Center",
        "positions": [
            {
                "code": "PG",
                "label": "Point Guard",
                "category": "Backcourt",
                "primaryMetrics": ["Basketball IQ", "Passing (PPP)", "Ball Handling", "Shooting (eFG%)", "Defense"],
                "tacticalNotes": "PPP floor general, pick-and-roll dissection, perimeter vision",
            },
            {
                "code": "SG",
                "label": "Shooting Guard",
                "category": "Backcourt",
                "primaryMetrics": ["Shooting (eFG%)", "True Shooting (TS%)", "Ball Handling", "Defense", "Vertical Jump"],
                "tacticalNotes": "Off-screen shot creation, spot-up eFG% scoring",
            },
            {
                "code": "SF",
                "label": "Small Forward",
                "category": "Wing",
                "primaryMetrics": ["Vertical Jump", "Shooting (eFG%)", "Defense", "Rebounding", "Basketball IQ"],
                "tacticalNotes": "Two-way versatile wing, slash to rim, multi-positional defense",
            },
            {
                "code": "PF",
                "label": "Power Forward",
                "category": "Frontcourt",
                "primaryMetrics": ["Rebounding", "Defense", "Vertical Jump", "Shooting (eFG%)", "Basketball IQ"],
                "tacticalNotes": "Weakside shot contest, interior finishing, pick-and-pop perimeter threat",
            },
            {
                "code": "C",
                "label": "Center",
                "category": "Frontcourt",
                "primaryMetrics": ["Rebounding", "Defense", "Vertical Jump", "Basketball IQ", "Passing (PPP)"],
                "tacticalNotes": "Paint rim deterrence, drop coverage anchor, screen angle setting",
            },
        ],
    },
    "tennis": {
        "key": "tennis",
        "name": "Tennis",
        "emoji": "🎾",
        "metrics": [
            "Serve (1st In %)",
            "Forehand",
            "Backhand",
            "Dominance Ratio (DR)",
            "Footwork",
            "Rally Win Rate",
            "Net Clearance",
            "Mental Strength",
        ],
        "radarLabels": ["Serve", "Forehand", "Backhand", "DR", "Footwork", "Mental"],
        "benchmarkSource": "Hawk-Eye Innovations, Tennis Abstract",
        "position": "Baseline / Net player",
        "positions": [
            {
                "code": "ABL",
                "label": "Aggressive Baseliner",
                "category": "Singles",
                "primaryMetrics": ["Forehand", "Backhand", "Dominance Ratio (DR)", "Rally Win Rate", "Mental Strength"],
                "tacticalNotes": "Heavy offensive groundstrokes, high DR ratio, dictating depth",
            },
            {
                "code": "SV",
                "label": "Serve & Volleyer",
                "category": "Singles / Doubles",
                "primaryMetrics": ["Serve (1st In %)", "Net Clearance", "Footwork", "Dominance Ratio (DR)", "Mental Strength"],
                "tacticalNotes": "First serve %, immediate net charge, sharp reflex volleys",
            },
            {
                "code": "CP",
                "label": "Counter-Puncher",
                "category": "Singles",
                "primaryMetrics": ["Footwork", "Rally Win Rate", "Mental Strength", "Backhand", "Dominance Ratio (DR)"],
                "tacticalNotes": "Lateral court coverage, high rally endurance, DR suppression",
            },
            {
                "code": "AC",
                "label": "All-Court Player",
                "category": "Singles / Doubles",
                "primaryMetrics": ["Forehand", "Net Clearance", "Footwork", "Rally Win Rate", "Serve (1st In %)"],
                "tacticalNotes": "Tactical spin/pace variety, opportunistic net approaches",
            },
        ],
    },
    "volleyball": {
        "key": "volleyball",
        "name": "Volleyball",
        "emoji": "🏐",
        "metrics": [
            "Kill % (Attack)",
            "Pass Rating (0–3)",
            "Block Efficiency",
            "Setting Accuracy",
            "Digging",
            "Vertical Jump",
            "Serve Effectiveness",
            "Positioning",
        ],
        "radarLabels": ["Kill%", "Pass Rating", "Block", "Setting", "Dig", "Jump"],
        "benchmarkSource": "Data Volley (Genius Sports), FIVB TSG",
        "hasKinematics": True,
        "position": "Setter / Libero / Spiker",
        "positions": [
            {
                "code": "SET",
                "label": "Setter",
                "category": "Playmaker",
                "primaryMetrics": ["Setting Accuracy", "Positioning", "Pass Rating (0–3)", "Serve Effectiveness", "Vertical Jump"],
                "tacticalNotes": "Setting accuracy %, tempo deception, second-tempo distribution",
            },
            {
                "code": "OH",
                "label": "Outside Hitter",
                "category": "Attacker",
                "primaryMetrics": ["Kill % (Attack)", "Vertical Jump", "Pass Rating (0–3)", "Serve Effectiveness", "Digging"],
                "tacticalNotes": "Approach step acceleration, kill %, out-of-system terminal hitting",
            },
            {
                "code": "WS",
                "label": "Wing Spiker",
                "category": "Attacker",
                "primaryMetrics": ["Kill % (Attack)", "Vertical Jump", "Serve Effectiveness", "Block Efficiency", "Digging"],
                "tacticalNotes": "Explosive approach from wings, kill % from left/right antenna",
            },
            {
                "code": "MB",
                "label": "Middle Blocker",
                "category": "Frontcourt",
                "primaryMetrics": ["Block Efficiency", "Kill % (Attack)", "Vertical Jump", "Positioning", "Serve Effectiveness"],
                "tacticalNotes": "Block touch rate, lateral read-and-react, quick slide attack",
            },
            {
                "code": "OPP",
                "label": "Opposite Hitter",
                "category": "Attacker",
                "primaryMetrics": ["Kill % (Attack)", "Block Efficiency", "Vertical Jump", "Serve Effectiveness", "Positioning"],
                "tacticalNotes": "Heavy right-side kill %, high-ball terminal finishing",
            },
            {
                "code": "LIB",
                "label": "Libero",
                "category": "Defense",
                "primaryMetrics": ["Pass Rating (0–3)", "Digging", "Positioning", "Serve Effectiveness", "Setting Accuracy"],
                "tacticalNotes": "Pass rating efficiency (target 2.5+), contrasting jersey required by rules",
            },
        ],
    },
    "custom": {
        "key": "custom",
        "name": "Custom Sport",
        "emoji": "🏆",
        "metrics": [
            "Agility & Speed",
            "Technical Skill",
            "Decision Making",
            "Physical Endurance",
            "Tactical Discipline",
            "Power / Explosiveness",
        ],
        "radarLabels": ["Agility", "Skill", "IQ", "Endurance", "Tactics", "Power"],
        "benchmarkSource": "Custom Metric Model",
        "position": "General Athlete",
        "positions": [
            {
                "code": "GEN",
                "label": "General Athlete",
                "category": "All-Around",
                "primaryMetrics": ["Technical Skill", "Decision Making", "Physical Endurance", "Agility & Speed"],
                "tacticalNotes": "Comprehensive biomechanical and tactical evaluation",
            }
        ],
    },
}


def get_sport_config(sport_key: str) -> dict:
    return SPORT_DEFINITIONS.get(sport_key.lower(), SPORT_DEFINITIONS["football"])
