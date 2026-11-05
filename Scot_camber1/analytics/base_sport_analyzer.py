#!/usr/bin/env python3
"""
SCOT AI - Base Sport Video Analyzer
Universal Computer Vision engine providing multi-object tracking (ByteTrack),
2D court homography transformations, metric speed calculation, distance aggregation,
and spatial density heatmap generation across all supported sporting disciplines.
"""

from abc import ABC, abstractmethod
from collections import defaultdict, deque
import math
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
import supervision as sv


class BaseSportAnalyzer(ABC):
    """
    Abstract architecture for real-time sports computer vision analytics.
    Subclasses implement sport-specific rules (e.g. Volleyball FIVB, Football FIFA, Basketball FIBA).
    """

    def __init__(
        self,
        sport_name: str,
        court_dimensions: Tuple[float, float],  # (length_m, width_m)
        homography_src_points: Optional[np.ndarray] = None,
        homography_dst_points: Optional[np.ndarray] = None,
        fps: float = 30.0,
        track_thresh: float = 0.45,
        track_buffer: int = 60,
        match_thresh: float = 0.8,
    ):
        self.sport_name = sport_name.lower()
        self.court_length_m, self.court_width_m = court_dimensions
        self.fps = max(1.0, float(fps))
        self.dt = 1.0 / self.fps

        # Initialize Supervision ByteTrack tracker
        self.tracker = sv.ByteTrack(
            track_activation_threshold=track_thresh,
            lost_track_buffer=track_buffer,
            minimum_matching_threshold=match_thresh,
            frame_rate=int(round(self.fps)),
        )

        # Homography Matrix: 2D Image Pixels -> Real-World Metric Court Plane
        self.H_matrix: Optional[np.ndarray] = None
        self.H_inv_matrix: Optional[np.ndarray] = None
        if homography_src_points is not None and homography_dst_points is not None:
            self.set_homography(homography_src_points, homography_dst_points)
        else:
            self._init_default_homography()

        # Telemetry & Kinematics Stores
        # track_id -> deque of (timestamp, x_m, y_m, speed_kmh)
        self.track_histories: Dict[int, deque] = defaultdict(lambda: deque(maxlen=300))
        # track_id -> total distance in meters
        self.total_distance_m: Dict[int, float] = defaultdict(float)
        # track_id -> list of instantaneous speeds
        self.speeds_kmh: Dict[int, List[float]] = defaultdict(list)
        # track_id -> class label
        self.track_classes: Dict[int, str] = {}
        # track_id -> bounding box history
        self.track_boxes: Dict[int, Tuple[float, float, float, float]] = {}

        # 2D Court Heatmap Accumulator (Grid shape e.g. 180x90 for 0.1m precision)
        self.grid_scale = 10  # 10 cells per meter (0.1m resolution)
        self.grid_h = int(round(self.court_width_m * self.grid_scale))
        self.grid_w = int(round(self.court_length_m * self.grid_scale))
        self.heatmap_accumulator = np.zeros((self.grid_h, self.grid_w), dtype=np.float32)

        # Standard Annotators
        self.box_annotator = sv.BoxAnnotator(thickness=2)
        self.label_annotator = sv.LabelAnnotator(
            text_scale=0.5,
            text_thickness=1,
            text_position=sv.Position.TOP_CENTER,
        )
        self.trace_annotator = sv.TraceAnnotator(
            trace_length=int(self.fps * 1.5),
            thickness=2,
            position=sv.Position.BOTTOM_CENTER,
        )

    def _init_default_homography(self):
        """Sets an identity fallback homography if manual calibration is deferred."""
        src = np.array([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], dtype=np.float32)
        dst = np.array(
            [
                [0.0, 0.0],
                [self.court_length_m, 0.0],
                [self.court_length_m, self.court_width_m],
                [0.0, self.court_width_m],
            ],
            dtype=np.float32,
        )
        self.set_homography(src, dst)

    def set_homography(self, src_pts: np.ndarray, dst_pts: np.ndarray) -> bool:
        """
        Computes 3x3 planar projective transformation matrix mapping camera pixels to ground plane meters.
        """
        src = np.asarray(src_pts, dtype=np.float32).reshape(-1, 1, 2)
        dst = np.asarray(dst_pts, dtype=np.float32).reshape(-1, 1, 2)
        H, status = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
        if H is not None:
            self.H_matrix = H
            self.H_inv_matrix = np.linalg.inv(H)
            return True
        return False

    def pixel_to_court(self, pixel_x: float, pixel_y: float) -> Optional[Tuple[float, float]]:
        """
        Transforms a 2D image coordinate (pixel_x, pixel_y) into metric court plane (X_m, Y_m).
        """
        if self.H_matrix is None:
            return None
        src_pt = np.array([[[pixel_x, pixel_y]]], dtype=np.float32)
        transformed = cv2.perspectiveTransform(src_pt, self.H_matrix)
        cx, cy = float(transformed[0, 0, 0]), float(transformed[0, 0, 1])
        return cx, cy

    def court_to_pixel(self, court_x_m: float, court_y_m: float) -> Optional[Tuple[int, int]]:
        """
        Projects metric court coordinates back into camera pixel coordinates.
        """
        if self.H_inv_matrix is None:
            return None
        src_pt = np.array([[[court_x_m, court_y_m]]], dtype=np.float32)
        transformed = cv2.perspectiveTransform(src_pt, self.H_inv_matrix)
        return int(round(transformed[0, 0, 0])), int(round(transformed[0, 0, 1]))

    def update_player_kinematics(
        self,
        track_id: int,
        foot_x: float,
        foot_y: float,
        timestamp_sec: float,
        class_name: str = "player",
    ) -> Dict[str, float]:
        """
        Updates speed and cumulative distance covered using ground-plane metric projection.
        Includes temporal smoothing to remove camera shake jitter.
        """
        court_coords = self.pixel_to_court(foot_x, foot_y)
        if court_coords is None:
            return {"speed_kmh": 0.0, "total_dist_m": self.total_distance_m[track_id]}

        cx, cy = court_coords
        self.track_classes[track_id] = class_name
        history = self.track_histories[track_id]

        instant_speed_kmh = 0.0
        delta_dist_m = 0.0

        if len(history) > 0:
            last_t, last_x, last_y, _ = history[-1]
            dt = max(1e-3, timestamp_sec - last_t)
            # Euclidean distance on real-world plane
            delta_dist_m = math.hypot(cx - last_x, cy - last_y)

            # Reject physical anomalies (e.g. tracking ID swap > 40 km/h sprint for court sports)
            max_plausible_speed_ms = 12.0  # ~43 km/h
            if delta_dist_m / dt < max_plausible_speed_ms:
                self.total_distance_m[track_id] += delta_dist_m
                speed_ms = delta_dist_m / dt
                raw_speed_kmh = speed_ms * 3.6

                # 3-frame Exponential Moving Average for clean telemetry
                prev_speed = history[-1][3]
                instant_speed_kmh = 0.6 * raw_speed_kmh + 0.4 * prev_speed
            else:
                instant_speed_kmh = history[-1][3]

        self.speeds_kmh[track_id].append(instant_speed_kmh)
        history.append((timestamp_sec, cx, cy, instant_speed_kmh))

        # Accumulate point onto spatial heatmap grid if inside court boundaries
        if 0.0 <= cx <= self.court_length_m and 0.0 <= cy <= self.court_width_m:
            gx = min(self.grid_w - 1, max(0, int(cx * self.grid_scale)))
            gy = min(self.grid_h - 1, max(0, int(cy * self.grid_scale)))
            self.heatmap_accumulator[gy, gx] += 1.0

        return {
            "court_x_m": round(cx, 2),
            "court_y_m": round(cy, 2),
            "speed_kmh": round(instant_speed_kmh, 2),
            "total_dist_m": round(self.total_distance_m[track_id], 2),
        }

    def generate_court_heatmap(self, colormap: int = cv2.COLORMAP_JET) -> np.ndarray:
        """
        Renders a high-resolution 2D spatial density heatmap of player positioning on the court plane.
        """
        if np.max(self.heatmap_accumulator) == 0:
            blank_court = np.zeros((self.grid_h, self.grid_w, 3), dtype=np.uint8)
            return blank_court

        # Apply Gaussian Blur to smooth discrete footprint points into density contours
        blurred = cv2.GaussianBlur(self.heatmap_accumulator, (15, 15), 0)
        norm_map = cv2.normalize(blurred, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
        norm_map = np.uint8(norm_map)

        color_heatmap = cv2.applyColorMap(norm_map, colormap)
        return color_heatmap

    @abstractmethod
    def process_frame(
        self,
        frame: np.ndarray,
        frame_idx: int,
        timestamp_sec: float,
    ) -> Dict[str, Any]:
        """
        Abstract method: Processes a single frame, runs detection, tracking,
        and sport-specific event and tactical rules.
        """
        pass

    @abstractmethod
    def annotate_frame(
        self,
        frame: np.ndarray,
        analysis_data: Dict[str, Any],
    ) -> np.ndarray:
        """
        Abstract method: Draws sport-specific HUD overlays, tracking paths,
        skeletal joint angles, and tactical markers onto the video frame.
        """
        pass

    @abstractmethod
    def generate_summary_report(self) -> Dict[str, Any]:
        """
        Abstract method: Compiles final comprehensive statistical payload
        suitable for web platform serialization (JSON).
        """
        pass

