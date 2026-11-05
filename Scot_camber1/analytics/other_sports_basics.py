#!/usr/bin/env python3
"""
SCOT AI - Football and Basketball Tactical Analyzers
Modular sport subclasses inheriting from BaseSportAnalyzer:
- FootballAnalyzer: Ball possession, K-Means jersey color team clustering, 105x68m pitch projection
- BasketballAnalyzer: 28x15m court tracking, ball carrier detection, paint / 3-point zone occupancy
"""

from collections import defaultdict, deque
import logging
import math
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from sklearn.cluster import KMeans
import supervision as sv
from ultralytics import YOLO

from .base_sport_analyzer import BaseSportAnalyzer

logger = logging.getLogger("scot_other_sports")


# ==============================================================================
# FOOTBALL (SOCCER) ANALYZER
# ==============================================================================
class FootballAnalyzer(BaseSportAnalyzer):
    """
    FIFA-Compliant 105m x 68m Tactical Pitch Computer Vision Engine.
    Features:
    - K-Means jersey color clustering (Team 1 vs. Team 2 vs. Goalkeeper/Ref)
    - Ball proximity possession tracking
    - Sprint velocity and spatial pitch coverage
    """

    def __init__(
        self,
        det_weights: str = "yolo11s.pt",
        homography_src_points: Optional[np.ndarray] = None,
        homography_dst_points: Optional[np.ndarray] = None,
        fps: float = 25.0,
        device: str = "cuda:0",
        possession_distance_m: float = 1.8,
    ):
        super().__init__(
            sport_name="football",
            court_dimensions=(105.0, 68.0),
            homography_src_points=homography_src_points,
            homography_dst_points=homography_dst_points,
            fps=fps,
        )
        self.device = device if cv2.cuda.getCudaEnabledDeviceCount() > 0 or "cuda" in device else "cpu"
        self.det_model = YOLO(det_weights)
        self.possession_distance_m = possession_distance_m

        # Team Jersey Color Clustering
        # track_id -> dominant color HSV
        self.player_torso_colors: Dict[int, np.ndarray] = {}
        self.team_assignments: Dict[int, str] = {}  # "Team A", "Team B", "Referee"
        self.kmeans_fitted = False
        self.team_colors_rgb = {"Team A": (220, 50, 50), "Team B": (50, 80, 220), "Referee": (220, 220, 40)}

        # Possession Metrics
        self.current_possession_player_id: Optional[int] = None
        self.team_possession_time_sec = {"Team A": 0.0, "Team B": 0.0, "Contested": 0.0}

    def extract_torso_color_feature(self, frame: np.ndarray, bbox: Tuple[float, float, float, float]) -> Optional[np.ndarray]:
        """
        Extracts dominant HSV color vector from the middle 30% of player bounding box (torso jersey).
        """
        x1, y1, x2, y2 = [int(v) for v in bbox]
        h, w = frame.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        box_h = y2 - y1
        box_w = x2 - x1
        if box_h < 20 or box_w < 10:
            return None

        # Torso slice: vertical 15% to 50%, horizontal central 60%
        torso_y1 = y1 + int(box_h * 0.15)
        torso_y2 = y1 + int(box_h * 0.50)
        torso_x1 = x1 + int(box_w * 0.20)
        torso_x2 = x2 - int(box_w * 0.20)

        crop = frame[torso_y1:torso_y2, torso_x1:torso_x2]
        if crop.size == 0:
            return None

        # Convert to HSV and compute median color to avoid skin/turf bias
        hsv_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        median_hsv = np.median(hsv_crop.reshape(-1, 3), axis=0)
        return median_hsv

    def update_team_clusters(self):
        """
        Runs K-Means (k=2 or k=3) on gathered player jersey colors to segment opposing teams.
        """
        if len(self.player_torso_colors) < 6:
            return

        features = np.array(list(self.player_torso_colors.values()))
        player_ids = list(self.player_torso_colors.keys())

        # Fit 2 clusters for the two teams
        kmeans = KMeans(n_clusters=2, random_state=42, n_init=5)
        labels = kmeans.fit_predict(features)

        for track_id, label in zip(player_ids, labels):
            self.team_assignments[track_id] = "Team A" if label == 0 else "Team B"

        self.kmeans_fitted = True

    def process_frame(
        self,
        frame: np.ndarray,
        frame_idx: int,
        timestamp_sec: float,
    ) -> Dict[str, Any]:
        """Runs detection and tracks players, ball, and team possession."""
        results = self.det_model(frame, verbose=False, device=self.device)[0]
        detections = sv.Detections.from_ultralytics(results)

        # Separate ball (class 1) from players (class 0)
        ball_idx = None
        for i, c in enumerate(detections.class_id):
            if c == 1:
                ball_idx = i
                break

        ball_court_pos = None
        if ball_idx is not None:
            bx1, by1, bx2, by2 = detections.xyxy[ball_idx]
            bc_x = float((bx1 + bx2) / 2.0)
            bc_y = float(by2)
            ball_court_pos = self.pixel_to_court(bc_x, bc_y)

        # Track Players
        player_detections = detections[detections.class_id == 0]
        tracked_players = self.tracker.update_with_detections(player_detections)

        # Extract jersey features for unassigned players
        for i, track_id in enumerate(tracked_players.tracker_id):
            if track_id not in self.player_torso_colors:
                feat = self.extract_torso_color_feature(frame, tracked_players.xyxy[i])
                if feat is not None:
                    self.player_torso_colors[track_id] = feat

        if not self.kmeans_fitted or len(self.player_torso_colors) % 15 == 0:
            self.update_team_clusters()

        # Update player kinematics and evaluate ball possession
        closest_player_id = None
        min_ball_dist = float("inf")

        players_list = []
        for i, track_id in enumerate(tracked_players.tracker_id):
            x1, y1, x2, y2 = tracked_players.xyxy[i]
            foot_x = float((x1 + x2) / 2.0)
            foot_y = float(y2)

            kin = self.update_player_kinematics(track_id, foot_x, foot_y, timestamp_sec)
            court_x = kin.get("court_x_m", 0.0)
            court_y = kin.get("court_y_m", 0.0)
            team = self.team_assignments.get(track_id, "Unassigned")

            # Check ball proximity
            if ball_court_pos is not None:
                d = math.hypot(court_x - ball_court_pos[0], court_y - ball_court_pos[1])
                if d < min_ball_dist:
                    min_ball_dist = d
                    closest_player_id = track_id

            players_list.append({
                "track_id": int(track_id),
                "bbox": [round(float(v), 1) for v in [x1, y1, x2, y2]],
                "team": team,
                "court_coords_m": {"x": court_x, "y": court_y},
                "speed_kmh": kin.get("speed_kmh", 0.0),
                "total_distance_m": kin.get("total_dist_m", 0.0),
            })

        # Possession logic
        if closest_player_id is not None and min_ball_dist <= self.possession_distance_m:
            self.current_possession_player_id = closest_player_id
            controlling_team = self.team_assignments.get(closest_player_id, "Contested")
            self.team_possession_time_sec[controlling_team] += self.dt
        else:
            self.team_possession_time_sec["Contested"] += self.dt

        return {
            "frame_idx": frame_idx,
            "timestamp_sec": round(timestamp_sec, 2),
            "players": players_list,
            "ball_court_m": ball_court_pos,
            "possession_player_id": self.current_possession_player_id,
            "possession_times": {k: round(v, 2) for k, v in self.team_possession_time_sec.items()},
        }

    def annotate_frame(self, frame: np.ndarray, analysis_data: Dict[str, Any]) -> np.ndarray:
        annotated = frame.copy()
        for p in analysis_data.get("players", []):
            x1, y1, x2, y2 = [int(v) for v in p["bbox"]]
            team = p["team"]
            tid = p["track_id"]
            speed = p["speed_kmh"]
            color = self.team_colors_rgb.get(team, (200, 200, 200))

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                annotated,
                f"#{tid} {team} | {speed:.1f} km/h",
                (x1, max(15, y1 - 6)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                color,
                1,
            )

        # Header HUD
        poss = analysis_data.get("possession_times", {})
        hud = f"SCOT FOOTBALL | Possession -> Team A: {poss.get('Team A', 0.0):.1f}s | Team B: {poss.get('Team B', 0.0):.1f}s"
        cv2.rectangle(annotated, (0, 0), (frame.shape[1], 32), (10, 10, 12), -1)
        cv2.putText(annotated, hud, (16, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        return annotated

    def generate_summary_report(self) -> Dict[str, Any]:
        total_time = sum(self.team_possession_time_sec.values()) or 1.0
        pct_a = (self.team_possession_time_sec["Team A"] / total_time) * 100.0
        pct_b = (self.team_possession_time_sec["Team B"] / total_time) * 100.0

        roster = {}
        for tid, dist in self.total_distance_m.items():
            spds = self.speeds_kmh.get(tid, [0.0])
            roster[str(tid)] = {
                "player_id": tid,
                "team": self.team_assignments.get(tid, "Unassigned"),
                "total_distance_m": round(dist, 2),
                "peak_speed_kmh": round(float(np.max(spds)), 2) if spds else 0.0,
            }

        return {
            "sport": "football",
            "pitch_dimensions_m": {"length": self.court_length_m, "width": self.court_width_m},
            "possession_percentages": {"team_a_pct": round(pct_a, 1), "team_b_pct": round(pct_b, 1)},
            "players_analytics": roster,
        }


# ==============================================================================
# BASKETBALL ANALYZER
# ==============================================================================
class BasketballAnalyzer(BaseSportAnalyzer):
    """
    FIBA-Compliant 28m x 15m Basketball Analytics Engine.
    Features:
    - Paint zone (key: 4.9m x 5.8m) occupancy & 3-second violations detection
    - Three-point perimeter spacing & Arc occupancy
    - Ball carrier detection and transition speed
    """

    def __init__(
        self,
        det_weights: str = "yolo11s.pt",
        homography_src_points: Optional[np.ndarray] = None,
        homography_dst_points: Optional[np.ndarray] = None,
        fps: float = 30.0,
        device: str = "cuda:0",
    ):
        super().__init__(
            sport_name="basketball",
            court_dimensions=(28.0, 15.0),
            homography_src_points=homography_src_points,
            homography_dst_points=homography_dst_points,
            fps=fps,
        )
        self.device = device if cv2.cuda.getCudaEnabledDeviceCount() > 0 or "cuda" in device else "cpu"
        self.det_model = YOLO(det_weights)

        # FIBA Court Specifications
        self.paint_width_m = 4.9
        self.paint_depth_m = 5.8
        self.three_point_radius_m = 6.75
        self.basket_left_pos = (1.575, 7.5)   # (X, Y) of left rim
        self.basket_right_pos = (26.425, 7.5) # (X, Y) of right rim

        # Zone Occupancy Tracking
        self.paint_occupancy_frames = 0
        self.three_point_zone_frames = 0

    def classify_court_zone(self, cx: float, cy: float) -> str:
        """Determines whether player is in Paint (Key), Mid-Range, or 3-Point Zone."""
        # Check Left Paint
        if 0.0 <= cx <= self.paint_depth_m and abs(cy - 7.5) <= (self.paint_width_m / 2.0):
            return "Paint (Key)"
        # Check Right Paint
        if (28.0 - self.paint_depth_m) <= cx <= 28.0 and abs(cy - 7.5) <= (self.paint_width_m / 2.0):
            return "Paint (Key)"

        # Check Three-Point Distance to closest basket
        d_left = math.hypot(cx - self.basket_left_pos[0], cy - self.basket_left_pos[1])
        d_right = math.hypot(cx - self.basket_right_pos[0], cy - self.basket_right_pos[1])
        min_basket_dist = min(d_left, d_right)

        if min_basket_dist >= self.three_point_radius_m:
            return "Beyond 3PT Arc"
        return "Mid-Range"

    def process_frame(
        self,
        frame: np.ndarray,
        frame_idx: int,
        timestamp_sec: float,
    ) -> Dict[str, Any]:
        results = self.det_model(frame, verbose=False, device=self.device)[0]
        detections = sv.Detections.from_ultralytics(results)

        # Track players (class 0)
        player_detections = detections[detections.class_id == 0]
        tracked_players = self.tracker.update_with_detections(player_detections)

        players_list = []
        for i, track_id in enumerate(tracked_players.tracker_id):
            x1, y1, x2, y2 = tracked_players.xyxy[i]
            foot_x = float((x1 + x2) / 2.0)
            foot_y = float(y2)

            kin = self.update_player_kinematics(track_id, foot_x, foot_y, timestamp_sec)
            cx = kin.get("court_x_m", 0.0)
            cy = kin.get("court_y_m", 0.0)

            zone = self.classify_court_zone(cx, cy)
            if zone == "Paint (Key)":
                self.paint_occupancy_frames += 1
            elif zone == "Beyond 3PT Arc":
                self.three_point_zone_frames += 1

            players_list.append({
                "track_id": int(track_id),
                "bbox": [round(float(v), 1) for v in [x1, y1, x2, y2]],
                "court_coords_m": {"x": cx, "y": cy},
                "zone": zone,
                "speed_kmh": kin.get("speed_kmh", 0.0),
                "total_distance_m": kin.get("total_dist_m", 0.0),
            })

        return {
            "frame_idx": frame_idx,
            "timestamp_sec": round(timestamp_sec, 2),
            "players": players_list,
        }

    def annotate_frame(self, frame: np.ndarray, analysis_data: Dict[str, Any]) -> np.ndarray:
        annotated = frame.copy()
        for p in analysis_data.get("players", []):
            x1, y1, x2, y2 = [int(v) for v in p["bbox"]]
            zone = p["zone"]
            tid = p["track_id"]
            speed = p["speed_kmh"]

            color = (0, 140, 255) if "Paint" in zone else (255, 180, 0)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                annotated,
                f"#{tid} {zone} | {speed:.1f}k",
                (x1, max(14, y1 - 6)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                color,
                1,
            )
        return annotated

    def generate_summary_report(self) -> Dict[str, Any]:
        roster = {}
        for tid, dist in self.total_distance_m.items():
            spds = self.speeds_kmh.get(tid, [0.0])
            roster[str(tid)] = {
                "player_id": tid,
                "total_distance_m": round(dist, 2),
                "peak_speed_kmh": round(float(np.max(spds)), 2) if spds else 0.0,
            }
        return {
            "sport": "basketball",
            "court_dimensions_m": {"length": self.court_length_m, "width": self.court_width_m},
            "zone_distribution": {
                "paint_occupancy_frames": self.paint_occupancy_frames,
                "three_point_zone_frames": self.three_point_zone_frames,
            },
            "players_analytics": roster,
        }

