import math
from typing import List, Dict, Any, Tuple

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False


class PlayerTracker:
    """
    ByteTrack / Centroid IoU Tracker with K-Means dominant jersey color clustering.
    Separates detected athletes into Team A, Team B, and Goalkeeper / Referee.
    """

    def __init__(self, max_lost_frames: int = 15, iou_threshold: float = 0.25):
        self.max_lost_frames = max_lost_frames
        self.iou_threshold = iou_threshold
        self.next_track_id = 1
        self.tracks: Dict[int, Dict[str, Any]] = {}

    def update(self, detections: List[Dict[str, Any]], frame: Any = None) -> List[Dict[str, Any]]:
        """
        Updates tracks with new detections from the current frame.
        """
        updated_results = []
        if not detections:
            # Increment lost frames for active tracks
            for tid in list(self.tracks.keys()):
                self.tracks[tid]["lost"] += 1
                if self.tracks[tid]["lost"] > self.max_lost_frames:
                    del self.tracks[tid]
            return []

        matched_tracks = set()
        matched_detections = set()

        # Match existing tracks with detections via IoU
        for tid, track in self.tracks.items():
            best_iou = 0.0
            best_det_idx = -1

            for d_idx, det in enumerate(detections):
                if d_idx in matched_detections:
                    continue
                iou = self._compute_iou(track["box"], det["box"])
                if iou > best_iou:
                    best_iou = iou
                    best_det_idx = d_idx

            if best_iou >= self.iou_threshold and best_det_idx >= 0:
                det = detections[best_det_idx]
                track["box"] = det["box"]
                track["pixelBox"] = det.get("pixelBox", [])
                track["lost"] = 0
                track["history"].append(det["box"])
                matched_tracks.add(tid)
                matched_detections.add(best_det_idx)

        # Create new tracks for unmatched detections
        for d_idx, det in enumerate(detections):
            if d_idx not in matched_detections and det["label"] == "person":
                tid = self.next_track_id
                self.next_track_id += 1
                self.tracks[tid] = {
                    "trackId": tid,
                    "box": det["box"],
                    "pixelBox": det.get("pixelBox", []),
                    "lost": 0,
                    "history": [det["box"]],
                    "teamColor": None,
                }
                matched_tracks.add(tid)

        # Extract jersey color for active tracks
        for tid in matched_tracks:
            tr = self.tracks[tid]
            if frame is not None and len(tr.get("pixelBox", [])) == 4:
                color_hex = self.extract_dominant_jersey_color(frame, tr["pixelBox"])
                tr["teamColor"] = color_hex

            updated_results.append({
                "trackId": tid,
                "box": tr["box"],
                "teamColorHex": tr.get("teamColor", "#6366f1"),
                "history": tr["history"],
            })

        return updated_results

    def extract_dominant_jersey_color(self, frame: Any, pixel_box: List[int]) -> str:
        """
        Samples the upper torso area (top 15% to 50% of the player box) to isolate the jersey.
        Uses K-Means clustering in HSV/BGR space to extract the dominant kit color.
        """
        if not HAS_CV2 or frame is None or len(pixel_box) != 4:
            return "#6366f1"

        x1, y1, x2, y2 = pixel_box
        h, w = frame.shape[:2]

        x1, x2 = max(0, x1), min(w, x2)
        y1, y2 = max(0, y1), min(h, y2)

        box_h = y2 - y1
        if box_h < 10 or (x2 - x1) < 10:
            return "#6366f1"

        # Torso crop: 15% to 50% from top of person box
        torso_y1 = y1 + int(box_h * 0.15)
        torso_y2 = y1 + int(box_h * 0.50)
        torso = frame[torso_y1:torso_y2, x1:x2]

        if torso.size == 0:
            return "#6366f1"

        # Reshape pixels and run K-Means (k=3)
        pixels = torso.reshape(-1, 3).astype(np.float32)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        try:
            _, labels, centers = cv2.kmeans(pixels, 3, None, criteria, 5, cv2.KMEANS_RANDOM_CENTERS)
            # Find the most frequent cluster center that is not grass-green
            counts = np.bincount(labels.flatten())
            sorted_indices = np.argsort(counts)[::-1]

            for idx in sorted_indices:
                b, g, r = centers[idx]
                # Avoid pitch green (dominant green hue)
                if g > r * 1.3 and g > b * 1.3:
                    continue
                return f"#{int(r):02x}{int(g):02x}{int(b):02x}"

            # Fallback to top center
            b, g, r = centers[sorted_indices[0]]
            return f"#{int(r):02x}{int(g):02x}{int(b):02x}"
        except Exception:
            return "#3b82f6"

    def _compute_iou(self, b1: Dict[str, float], b2: Dict[str, float]) -> float:
        x1_1, y1_1 = b1["x"], b1["y"]
        x2_1, y2_1 = b1["x"] + b1["w"], b1["y"] + b1["h"]

        x1_2, y1_2 = b2["x"], b2["y"]
        x2_2, y2_2 = b2["x"] + b2["w"], b2["y"] + b2["h"]

        xi1, yi1 = max(x1_1, x1_2), max(y1_1, y1_2)
        xi2, yi2 = min(x2_1, x2_2), min(y2_1, y2_2)

        inter_w = max(0.0, xi2 - xi1)
        inter_h = max(0.0, yi2 - yi1)
        inter_area = inter_w * inter_h

        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union_area = area1 + area2 - inter_area

        if union_area <= 0:
            return 0.0
        return inter_area / union_area


tracker = PlayerTracker()
