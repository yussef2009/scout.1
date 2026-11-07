#!/usr/bin/env python3
"""
SCOT AI - Specialized Volleyball Analytics & FIVB Rule Engine
Combines YOLOv11 object tracking with 17-keypoint skeletal pose kinematics to deliver:
1. Action Classification: Serve, Spike, Block, Set, Dig
2. Biomechanical Vertical Leap & Jump Height (cm)
3. Ball Trajectory Tracking & Spike/Serve Velocity (km/h)
4. FIVB 6-Zone Court Mapping & Rotation / Back-Row Fault Detection
"""

from collections import deque
import logging
import math
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
import supervision as sv
from ultralytics import YOLO

from .base_sport_analyzer import BaseSportAnalyzer

logger = logging.getLogger("scot_volleyball")

# COCO Keypoint Indices (17 keypoints from YOLOv11-Pose)
NOSE = 0
LEFT_EYE, RIGHT_EYE = 1, 2
LEFT_EAR, RIGHT_EAR = 3, 4
LEFT_SHOULDER, RIGHT_SHOULDER = 5, 6
LEFT_ELBOW, RIGHT_ELBOW = 7, 8
LEFT_WRIST, RIGHT_WRIST = 9, 10
LEFT_HIP, RIGHT_HIP = 11, 12
LEFT_KNEE, RIGHT_KNEE = 13, 14
LEFT_ANKLE, RIGHT_ANKLE = 15, 16

SKELETON_PAIRS = [
    (LEFT_SHOULDER, RIGHT_SHOULDER),
    (LEFT_SHOULDER, LEFT_ELBOW),
    (LEFT_ELBOW, LEFT_WRIST),
    (RIGHT_SHOULDER, RIGHT_ELBOW),
    (RIGHT_ELBOW, RIGHT_WRIST),
    (LEFT_SHOULDER, LEFT_HIP),
    (RIGHT_SHOULDER, RIGHT_HIP),
    (LEFT_HIP, RIGHT_HIP),
    (LEFT_HIP, LEFT_KNEE),
    (LEFT_KNEE, LEFT_ANKLE),
    (RIGHT_HIP, RIGHT_KNEE),
    (RIGHT_KNEE, RIGHT_ANKLE),
]


def calculate_angle_3pts(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """Calculates internal angle ABC in degrees (vertex at B)."""
    ba = a - b
    bc = c - b
    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)
    if norm_ba < 1e-4 or norm_bc < 1e-4:
        return 180.0
    cosine = np.dot(ba, bc) / (norm_ba * norm_bc)
    cosine = np.clip(cosine, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosine)))


class VolleyballAnalyzer(BaseSportAnalyzer):
    """
    FIVB-Compliant Computer Vision Analyzer for Volleyball match broadcasts.
    """

    def __init__(
        self,
        det_weights: str = "yolo11s.pt",
        pose_weights: str = "yolo11s-pose.pt",
        homography_src_points: Optional[np.ndarray] = None,
        homography_dst_points: Optional[np.ndarray] = None,
        fps: float = 30.0,
        device: str = "cuda:0",
        net_height_m: float = 2.43,
    ):
        # FIVB standard court: 18.0m length x 9.0m width
        super().__init__(
            sport_name="volleyball",
            court_dimensions=(18.0, 9.0),
            homography_src_points=homography_src_points,
            homography_dst_points=homography_dst_points,
            fps=fps,
        )

        self.device = device if cv2.cuda.getCudaEnabledDeviceCount() > 0 or "cuda" in device else "cpu"
        self.net_height_m = net_height_m
        self.net_x_m = 9.0  # Centerline dividing Court A and Court B
        self.attack_line_court_a = 6.0   # 3m from net for Court A (9 - 3)
        self.attack_line_court_b = 12.0  # 3m from net for Court B (9 + 3)

        # Load models
        logger.info(f"Loading YOLOv11 Detection ({det_weights}) and Pose ({pose_weights}) on {self.device}...")
        self.det_model = YOLO(det_weights)
        self.pose_model = YOLO(pose_weights)

        # Ball Tracking State
        self.ball_history: deque = deque(maxlen=60)  # (timestamp, px, py, court_x, court_y, speed_kmh)
        self.peak_ball_speed_kmh = 0.0
        self.recent_ball_speeds: deque = deque(maxlen=10)

        # Vertical Leap & Jump Baseline Tracking
        # track_id -> floor baseline hip y in pixels (minimum elevation)
        self.player_baseline_hip_y: Dict[int, float] = {}
        self.player_max_jump_cm: Dict[int, float] = defaultdict(float)
        self.current_jump_height_cm: Dict[int, float] = defaultdict(float)
        self.is_jumping: Dict[int, bool] = defaultdict(bool)

        # Action History and Event Logs
        self.action_history: Dict[int, deque] = defaultdict(lambda: deque(maxlen=15))
        self.event_log: List[Dict[str, Any]] = []

        # FIVB Zone Occupancy Counts: zone_id -> frame hits
        self.zone_occupancy: Dict[str, int] = defaultdict(int)

    def resolve_fivb_zone(self, court_x_m: float, court_y_m: float) -> Tuple[str, str, str]:
        """
        Maps metric coordinates (X, Y) into official FIVB 6-Zones.
        Returns: (court_half, zone_name, row_type)
        Court A (0-9m):
          Front row (6m-9m): Zone 4 (Left: 0-3m), Zone 3 (Center: 3-6m), Zone 2 (Right: 6-9m)
          Back row (0m-6m) : Zone 5 (Left: 0-3m), Zone 6 (Center: 3-6m), Zone 1 (Right: 6-9m)
        Court B (9-18m):
          Front row (9m-12m): Zone 2 (Left: 0-3m), Zone 3 (Center: 3-6m), Zone 4 (Right: 6-9m)
          Back row (12m-18m): Zone 1 (Left: 0-3m), Zone 6 (Center: 3-6m), Zone 5 (Right: 6-9m)
        """
        if court_x_m < 0.0 or court_x_m > 18.0 or court_y_m < 0.0 or court_y_m > 9.0:
            return "out_of_bounds", "Out", "none"

        if court_x_m <= 9.0:
            court_side = "Court A"
            is_front = court_x_m >= self.attack_line_court_a
            row = "front" if is_front else "back"

            if is_front:
                if court_y_m < 3.0:
                    zone = "Zone 4"
                elif court_y_m < 6.0:
                    zone = "Zone 3"
                else:
                    zone = "Zone 2"
            else:
                if court_y_m < 3.0:
                    zone = "Zone 5"
                elif court_y_m < 6.0:
                    zone = "Zone 6"
                else:
                    zone = "Zone 1"
        else:
            court_side = "Court B"
            is_front = court_x_m <= self.attack_line_court_b
            row = "front" if is_front else "back"

            if is_front:
                if court_y_m < 3.0:
                    zone = "Zone 2"
                elif court_y_m < 6.0:
                    zone = "Zone 3"
                else:
                    zone = "Zone 4"
            else:
                if court_y_m < 3.0:
                    zone = "Zone 1"
                elif court_y_m < 6.0:
                    zone = "Zone 6"
                else:
                    zone = "Zone 5"

        return court_side, zone, row

    def classify_volleyball_action(
        self,
        keypoints: np.ndarray,  # Shape (17, 3) -> [x, y, conf]
        court_x_m: float,
        court_y_m: float,
        jump_height_cm: float,
        ball_pos: Optional[Tuple[float, float]],
    ) -> Tuple[str, float]:
        """
        Evaluates 17 skeletal joint angles and spatial positions to identify volleyball touch actions.
        Returns: (action_name, confidence)
        """
        # Require confidence in core torso keypoints
        sh_conf = min(keypoints[LEFT_SHOULDER][2], keypoints[RIGHT_SHOULDER][2])
        hip_conf = min(keypoints[LEFT_HIP][2], keypoints[RIGHT_HIP][2])
        if sh_conf < 0.35 or hip_conf < 0.35:
            return "Idle", 0.4

        sh_y = (keypoints[LEFT_SHOULDER][1] + keypoints[RIGHT_SHOULDER][1]) / 2.0
        sh_span = np.linalg.norm(keypoints[LEFT_SHOULDER][:2] - keypoints[RIGHT_SHOULDER][:2])
        wrist_dist = np.linalg.norm(keypoints[LEFT_WRIST][:2] - keypoints[RIGHT_WRIST][:2])

        left_wrist_y = keypoints[LEFT_WRIST][1]
        right_wrist_y = keypoints[RIGHT_WRIST][1]
        hip_y = (keypoints[LEFT_HIP][1] + keypoints[RIGHT_HIP][1]) / 2.0

        # Knee flexion angle (average of both legs)
        l_knee_angle = calculate_angle_3pts(keypoints[LEFT_HIP][:2], keypoints[LEFT_KNEE][:2], keypoints[LEFT_ANKLE][:2])
        r_knee_angle = calculate_angle_3pts(keypoints[RIGHT_HIP][:2], keypoints[RIGHT_KNEE][:2], keypoints[RIGHT_ANKLE][:2])
        avg_knee_angle = (l_knee_angle + r_knee_angle) / 2.0

        # Elbow flexion angles
        l_elbow_angle = calculate_angle_3pts(keypoints[LEFT_SHOULDER][:2], keypoints[LEFT_ELBOW][:2], keypoints[LEFT_WRIST][:2])
        r_elbow_angle = calculate_angle_3pts(keypoints[RIGHT_SHOULDER][:2], keypoints[RIGHT_ELBOW][:2], keypoints[RIGHT_WRIST][:2])

        # Proximity to net (centerline at X=9.0m)
        dist_to_net_m = abs(court_x_m - self.net_x_m)

        # -------------------------------------------------------------
        # 1. BLOCK DETECTION (FIVB Rule: Near net, both hands overhead, jumping)
        # -------------------------------------------------------------
        if (
            dist_to_net_m <= 1.2
            and jump_height_cm >= 20.0
            and left_wrist_y < sh_y
            and right_wrist_y < sh_y
        ):
            # Both arms fully extended overhead
            if l_elbow_angle > 140.0 and r_elbow_angle > 140.0:
                conf = min(0.95, 0.6 + (jump_height_cm / 100.0) * 0.3)
                return "Block", conf

        # -------------------------------------------------------------
        # 2. SPIKE / ATTACK DETECTION (High vertical jump, one arm high cocked, front zone)
        # -------------------------------------------------------------
        unilateral_overhead = (left_wrist_y < sh_y - 20.0) or (right_wrist_y < sh_y - 20.0)
        if jump_height_cm >= 25.0 and unilateral_overhead and dist_to_net_m <= 3.8:
            # One dominant hitting arm extended, other tracking/balancing
            conf = min(0.92, 0.55 + (jump_height_cm / 80.0) * 0.35)
            return "Spike", conf

        # -------------------------------------------------------------
        # 3. JUMP SERVE / STANDING SERVE (Service zone at endlines: X < 1.0 or X > 17.0)
        # -------------------------------------------------------------
        is_service_area = court_x_m <= 1.5 or court_x_m >= 16.5
        if is_service_area and (left_wrist_y < sh_y or right_wrist_y < sh_y):
            if jump_height_cm > 15.0:
                return "Serve", 0.88
            else:
                return "Serve", 0.75

        # -------------------------------------------------------------
        # 4. DIG / RECEPTION PLATFORM (Low crouch, wrists pressed together below chest)
        # -------------------------------------------------------------
        # Forearm platform geometry: wrists close together relative to shoulder span
        platform_ratio = wrist_dist / max(1.0, sh_span)
        if platform_ratio < 0.45 and left_wrist_y > sh_y and right_wrist_y > sh_y:
            # Low center of gravity: knees bent (< 140 degrees) or hands below hip level
            if avg_knee_angle < 145.0 or (left_wrist_y > hip_y - 20):
                return "Dig", 0.85

        # -------------------------------------------------------------
        # 5. OVERHEAD SET (Two symmetrical hands overhead, elbows out ~90-130°)
        # -------------------------------------------------------------
        both_hands_high = left_wrist_y < sh_y and right_wrist_y < sh_y
        if both_hands_high and (90.0 <= l_elbow_angle <= 145.0) and (90.0 <= r_elbow_angle <= 145.0):
            # Hands separated (unlike a block where fingers splay wide or dig platform)
            if 0.35 <= platform_ratio <= 1.2:
                return "Set", 0.82

        return "Idle", 0.5

    def calculate_vertical_leap_cm(
        self,
        track_id: int,
        keypoints: np.ndarray,
        player_bbox_height: float,
    ) -> float:
        """
        Estimates real-world vertical leap in centimeters from hip midpoint elevation.
        Uses player bounding box height as an adaptive scale factor (assuming average player ~1.90m).
        """
        l_hip, r_hip = keypoints[LEFT_HIP], keypoints[RIGHT_HIP]
        l_ank, r_ank = keypoints[LEFT_ANKLE], keypoints[RIGHT_ANKLE]

        if l_hip[2] < 0.3 or r_hip[2] < 0.3:
            return self.current_jump_height_cm[track_id]

        hip_center_y = (l_hip[1] + r_hip[1]) / 2.0

        # Calibrate / update standing floor baseline
        # (Lower y in pixel space is higher in altitude; baseline is maximum y on ground)
        if track_id not in self.player_baseline_hip_y:
            self.player_baseline_hip_y[track_id] = hip_center_y
        else:
            # Gradually adapt baseline to accommodate camera zoom or posture
            if hip_center_y > self.player_baseline_hip_y[track_id]:
                self.player_baseline_hip_y[track_id] = (
                    0.95 * self.player_baseline_hip_y[track_id] + 0.05 * hip_center_y
                )

        baseline_y = self.player_baseline_hip_y[track_id]
        delta_y_pixels = baseline_y - hip_center_y

        if delta_y_pixels <= 5.0:
            jump_cm = 0.0
            self.is_jumping[track_id] = False
        else:
            # Metric conversion ratio: assume player bbox height ~190 cm for professional volleyball athletes
            cm_per_pixel = 190.0 / max(50.0, player_bbox_height)
            jump_cm = max(0.0, delta_y_pixels * cm_per_pixel)

            if jump_cm >= 15.0:
                self.is_jumping[track_id] = True
                if jump_cm > self.player_max_jump_cm[track_id]:
                    self.player_max_jump_cm[track_id] = round(jump_cm, 1)

        self.current_jump_height_cm[track_id] = round(jump_cm, 1)
        return self.current_jump_height_cm[track_id]

    def update_ball_dynamics(
        self,
        detections: sv.Detections,
        timestamp_sec: float,
    ) -> Optional[Dict[str, float]]:
        """
        Tracks the high-speed volleyball trajectory and computes velocity in km/h.
        """
        # Search for ball class (usually class_id == 1 or 'ball')
        ball_idx = None
        for i, class_id in enumerate(detections.class_id):
            if class_id == 1:  # Volleyball class ID
                ball_idx = i
                break

        if ball_idx is None:
            return None

        bx1, by1, bx2, by2 = detections.xyxy[ball_idx]
        ball_center_x = float((bx1 + bx2) / 2.0)
        ball_center_y = float((by1 + by2) / 2.0)

        court_coords = self.pixel_to_court(ball_center_x, ball_center_y)
        if court_coords is None:
            return None

        cx, cy = court_coords
        speed_kmh = 0.0

        if len(self.ball_history) > 0:
            last_t, last_px, last_py, last_cx, last_cy, _ = self.ball_history[-1]
            dt = max(1e-3, timestamp_sec - last_t)
            # 2D Metric displacement
            dist_m = math.hypot(cx - last_cx, cy - last_cy)

            # Standard volleyball speeds range from 30 km/h (soft roll) to 135 km/h (world-record jump spike)
            raw_speed_kmh = (dist_m / dt) * 3.6
            if raw_speed_kmh <= 145.0:
                speed_kmh = raw_speed_kmh
                self.recent_ball_speeds.append(speed_kmh)
                if speed_kmh > self.peak_ball_speed_kmh:
                    self.peak_ball_speed_kmh = round(speed_kmh, 1)

        self.ball_history.append((timestamp_sec, ball_center_x, ball_center_y, cx, cy, speed_kmh))
        return {
            "ball_px": ball_center_x,
            "ball_py": ball_center_y,
            "court_x_m": round(cx, 2),
            "court_y_m": round(cy, 2),
            "speed_kmh": round(speed_kmh, 1),
            "peak_speed_kmh": self.peak_ball_speed_kmh,
        }

    def process_frame(
        self,
        frame: np.ndarray,
        frame_idx: int,
        timestamp_sec: float,
    ) -> Dict[str, Any]:
        """
        Processes a single video frame through detection, tracking, pose, and rules engine.
        """
        # 1. Run YOLOv11 Detection for players and ball
        det_results = self.det_model(frame, verbose=False, device=self.device)[0]
        detections = sv.Detections.from_ultralytics(det_results)

        # 2. Filter Players (class 0) for ByteTrack Tracking
        player_mask = detections.class_id == 0
        player_detections = detections[player_mask]
        tracked_players = self.tracker.update_with_detections(player_detections)

        # 3. Track Ball Dynamics
        ball_data = self.update_ball_dynamics(detections, timestamp_sec)

        # 4. Run YOLOv11 Pose Estimation across frame
        pose_results = self.pose_model(frame, verbose=False, device=self.device)[0]

        # Map tracked player bounding boxes to corresponding pose keypoints
        poses_data = {}
        if hasattr(pose_results, "keypoints") and pose_results.keypoints is not None:
            raw_kpts = pose_results.keypoints.data.cpu().numpy()  # Shape: (N, 17, 3)
            pose_boxes = pose_results.boxes.xyxy.cpu().numpy()

            for track_idx, track_id in enumerate(tracked_players.tracker_id):
                px1, py1, px2, py2 = tracked_players.xyxy[track_idx]
                p_center = np.array([(px1 + px2) / 2.0, (py1 + py2) / 2.0])

                # Match with closest pose detection center
                best_iou = 0.0
                best_pose_idx = -1
                for p_i, p_box in enumerate(pose_boxes):
                    # Compute box IoU
                    ix1 = max(px1, p_box[0])
                    iy1 = max(py1, p_box[1])
                    ix2 = min(px2, p_box[2])
                    iy2 = min(py2, p_box[3])
                    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
                    union = (px2 - px1) * (py2 - py1) + (p_box[2] - p_box[0]) * (p_box[3] - p_box[1]) - inter
                    iou = inter / max(1.0, union)
                    if iou > best_iou:
                        best_iou = iou
                        best_pose_idx = p_i

                if best_pose_idx >= 0 and best_iou > 0.3:
                    poses_data[track_id] = raw_kpts[best_pose_idx]

        # 5. Compile Player Telemetry, Actions & FIVB Rules
        players_payload = []
        for i, track_id in enumerate(tracked_players.tracker_id):
            x1, y1, x2, y2 = tracked_players.xyxy[i]
            foot_x = float((x1 + x2) / 2.0)
            foot_y = float(y2)
            bbox_h = float(y2 - y1)

            # Update universal distance and speed
            kinematics = self.update_player_kinematics(track_id, foot_x, foot_y, timestamp_sec)
            court_x = kinematics.get("court_x_m", 0.0)
            court_y = kinematics.get("court_y_m", 0.0)

            # FIVB Zone resolution
            court_half, zone_name, row_type = self.resolve_fivb_zone(court_x, court_y)
            if zone_name != "Out":
                self.zone_occupancy[f"{court_half} {zone_name}"] += 1

            # Vertical Leap
            jump_cm = 0.0
            kpts = poses_data.get(track_id)
            if kpts is not None:
                jump_cm = self.calculate_vertical_leap_cm(track_id, kpts, bbox_h)

            # Action Recognition
            action = "Idle"
            action_conf = 0.5
            ball_pos = (ball_data["court_x_m"], ball_data["court_y_m"]) if ball_data else None
            if kpts is not None:
                action, action_conf = self.classify_volleyball_action(
                    kpts, court_x, court_y, jump_cm, ball_pos
                )

            # Log meaningful actions (Spike, Serve, Block, Set, Dig)
            if action != "Idle":
                self.action_history[track_id].append(action)
                if len(self.action_history[track_id]) >= 3:
                    # Consensus filter over 3 consecutive classifications
                    common_action = max(
                        set(self.action_history[track_id]),
                        key=list(self.action_history[track_id]).count,
                    )
                    event_entry = {
                        "timestamp_sec": round(timestamp_sec, 2),
                        "frame_idx": frame_idx,
                        "player_id": int(track_id),
                        "action": common_action,
                        "confidence": round(action_conf, 2),
                        "zone": zone_name,
                        "court": court_half,
                        "jump_height_cm": jump_cm,
                    }

                    # FIVB Rule 13.2.2: Check Back-Row Attack Fault
                    if common_action == "Spike" and row_type == "back":
                        if court_half == "Court A" and court_x > self.attack_line_court_a:
                            event_entry["fivb_fault"] = "BACK_ROW_ATTACK_VIOLATION (Crossed 3m Line)"
                        elif court_half == "Court B" and court_x < self.attack_line_court_b:
                            event_entry["fivb_fault"] = "BACK_ROW_ATTACK_VIOLATION (Crossed 3m Line)"

                    self.event_log.append(event_entry)

            players_payload.append({
                "track_id": int(track_id),
                "bbox": [round(float(v), 1) for v in [x1, y1, x2, y2]],
                "court_coords_m": {"x": court_x, "y": court_y},
                "speed_kmh": kinematics.get("speed_kmh", 0.0),
                "total_distance_m": kinematics.get("total_dist_m", 0.0),
                "vertical_leap_cm": jump_cm,
                "max_vertical_leap_cm": self.player_max_jump_cm[track_id],
                "fivb_zone": zone_name,
                "court_half": court_half,
                "row": row_type,
                "action": action,
            })

        return {
            "frame_idx": frame_idx,
            "timestamp_sec": round(timestamp_sec, 3),
            "players": players_payload,
            "ball": ball_data,
            "active_events_count": len(self.event_log),
            "tracked_objects": tracked_players,
            "poses": poses_data,
        }

    def annotate_frame(
        self,
        frame: np.ndarray,
        analysis_data: Dict[str, Any],
    ) -> np.ndarray:
        """
        Renders HUD overlays: skeletal poses, bounding boxes, speed tags,
        jump height pills, and ball velocity trails.
        """
        annotated = frame.copy()
        h, w = frame.shape[:2]

        # 1. Draw Ball Trajectory Trail
        if len(self.ball_history) > 1:
            points = list(self.ball_history)
            for i in range(1, len(points)):
                pt1 = (int(points[i - 1][1]), int(points[i - 1][2]))
                pt2 = (int(points[i][1]), int(points[i][2]))
                alpha = float(i) / len(points)
                thickness = max(1, int(4 * alpha))
                color = (0, int(255 * alpha), 255)  # Yellow to bright cyan
                cv2.line(annotated, pt1, pt2, color, thickness)

        # 2. Draw Skeletal Keypoints
        poses_map = analysis_data.get("poses", {})
        for track_id, kpts in poses_map.items():
            for p1, p2 in SKELETON_PAIRS:
                if kpts[p1][2] > 0.4 and kpts[p2][2] > 0.4:
                    pt1 = (int(kpts[p1][0]), int(kpts[p1][1]))
                    pt2 = (int(kpts[p2][0]), int(kpts[p2][1]))
                    cv2.line(annotated, pt1, pt2, (0, 255, 128), 2)

            for kp in kpts:
                if kp[2] > 0.4:
                    cv2.circle(annotated, (int(kp[0]), int(kp[1])), 3, (255, 0, 128), -1)

        # 3. Draw Player Bounding Boxes & Telemetry HUD Badges
        for p in analysis_data.get("players", []):
            x1, y1, x2, y2 = [int(v) for v in p["bbox"]]
            track_id = p["track_id"]
            action = p["action"]
            zone = p["fivb_zone"]
            jump_cm = p["vertical_leap_cm"]
            speed = p["speed_kmh"]

            # Distinct color for jumping / spiking actions
            box_color = (0, 215, 255) if action == "Spike" else (0, 255, 0)
            if action == "Block":
                box_color = (255, 165, 0)

            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 2)

            # Badge Label Text
            header_text = f"#{track_id} {action.upper()} | {zone}"
            stats_text = f"{speed:.1f} km/h"
            if jump_cm > 15.0:
                stats_text += f" | JUMP: {jump_cm:.0f}cm"

            # Draw background box for text
            cv2.rectangle(annotated, (x1, max(0, y1 - 32)), (x1 + 180, y1), (15, 15, 15), -1)
            cv2.putText(
                annotated,
                header_text,
                (x1 + 4, max(12, y1 - 18)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.42,
                (255, 255, 255),
                1,
                cv2.LINE_AA,
            )
            cv2.putText(
                annotated,
                stats_text,
                (x1 + 4, max(24, y1 - 5)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.38,
                (0, 215, 255),
                1,
                cv2.LINE_AA,
            )

        # 4. Top Telemetry Banner
        ball = analysis_data.get("ball")
        peak_ball = ball.get("peak_speed_kmh", 0.0) if ball else self.peak_ball_speed_kmh
        current_ball = ball.get("speed_kmh", 0.0) if ball else 0.0

        banner_text = (
            f"SCOT AI VOLLEYBALL | Ball Speed: {current_ball:.1f} km/h (Peak: {peak_ball:.1f} km/h) "
            f"| Active Players: {len(analysis_data.get('players', []))} | FIVB Events: {len(self.event_log)}"
        )
        cv2.rectangle(annotated, (0, 0), (w, 36), (10, 10, 14), -1)
        cv2.putText(
            annotated,
            banner_text,
            (16, 24),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 230, 255),
            2,
            cv2.LINE_AA,
        )

        return annotated

    def generate_summary_report(self) -> Dict[str, Any]:
        """
        Compiles match statistics, peak jump and velocity analytics, and zone distributions.
        """
        # Deduplicate event log to unique rallies
        roster_summary = {}
        for track_id, dist in self.total_distance_m.items():
            speeds = self.speeds_kmh.get(track_id, [0.0])
            avg_speed = float(np.mean(speeds)) if speeds else 0.0
            max_speed = float(np.max(speeds)) if speeds else 0.0

            roster_summary[str(track_id)] = {
                "player_id": track_id,
                "role": self.track_classes.get(track_id, "player"),
                "total_distance_covered_m": round(dist, 2),
                "average_speed_kmh": round(avg_speed, 2),
                "peak_sprint_speed_kmh": round(max_speed, 2),
                "max_vertical_leap_cm": self.player_max_jump_cm.get(track_id, 0.0),
            }

        return {
            "sport": "volleyball",
            "regulation": "FIVB Indoor Standards",
            "net_height_m": self.net_height_m,
            "court_dimensions_m": {"length": self.court_length_m, "width": self.court_width_m},
            "ball_dynamics": {
                "peak_velocity_kmh": self.peak_ball_speed_kmh,
                "total_ball_touches_tracked": len(self.ball_history),
            },
            "players_analytics": roster_summary,
            "tactical_fivb_events": self.event_log[-50:],  # Top 50 logged actions
            "zone_distribution_occupancy": dict(self.zone_occupancy),
        }

