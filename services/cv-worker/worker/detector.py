import os
import logging
from typing import List, Dict, Any, Optional

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

import importlib

HAS_YOLO = False
HAS_CUDA = False
YOLO = None

try:
    _ultralytics = importlib.import_module("ultralytics")
    _torch = importlib.import_module("torch")
    YOLO = getattr(_ultralytics, "YOLO", None)
    HAS_YOLO = YOLO is not None
    HAS_CUDA = bool(hasattr(_torch, "cuda") and _torch.cuda.is_available())
except (ImportError, ModuleNotFoundError):
    HAS_YOLO = False
    HAS_CUDA = False
    YOLO = None

logger = logging.getLogger("scoutai.detector")


class PlayerDetector:
    """
    Hybrid Player Detector.
    Supports YOLOv11 (GPU / CUDA when available, with automatic CPU mode fallback)
    and graceful lightweight CPU mode using adaptive thresholding, contours, and color saliency.
    """

    def __init__(self, mode: Optional[str] = None, model_name: str = "yolo11n.pt"):
        self.mode = (mode or os.getenv("CV_MODE", "lightweight")).lower()
        self.model_name = model_name
        self.yolo_model = None
        self.device = "cuda" if HAS_CUDA else "cpu"

        if self.mode != "lightweight" and HAS_YOLO and YOLO is not None:
            try:
                self.yolo_model = YOLO(self.model_name)
                logger.info(f"[PlayerDetector] Loaded YOLO model '{self.model_name}' on device '{self.device}'.")
            except Exception as e:
                logger.warning(f"[PlayerDetector] YOLO init failed ({e}). Falling back to lightweight CPU mode.")
                self.mode = "lightweight"
        else:
            self.mode = "lightweight"

    @staticmethod
    def compute_sharpness(crop: Any) -> float:
        """
        Computes bounding box focus / sharpness using Laplacian variance.
        Values > 25.0 indicate crisp, well-focused player crops; values < 10.0 indicate motion blur.
        """
        if not HAS_CV2 or crop is None or crop.size == 0:
            return 0.0

        if len(crop.shape) == 3:
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        else:
            gray = crop

        lap = cv2.Laplacian(gray, cv2.CV_64F)
        var = float(lap.var())
        return round(var, 2)

    def detect_in_frame(self, frame: Any) -> List[Dict[str, Any]]:
        """
        Detects players in a single frame.
        Returns list of detections with normalized coordinates: {x, y, w, h, class_id, confidence, sharpness, pixelBox}
        """
        if not HAS_CV2 or frame is None:
            return []

        h, w = frame.shape[:2]
        if w <= 0 or h <= 0:
            return []

        if self.mode != "lightweight" and self.yolo_model:
            return self._detect_yolo(frame, w, h)
        else:
            return self._detect_lightweight(frame, w, h)

    def _detect_yolo(self, frame: Any, width: int, height: int) -> List[Dict[str, Any]]:
        try:
            results = self.yolo_model(frame, classes=[0, 32], device=self.device, verbose=False)
            detections = []

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())

                    # Person (0) or Sports Ball (32)
                    if conf >= 0.30:
                        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                        x1, x2 = max(0, x1), min(width, x2)
                        y1, y2 = max(0, y1), min(height, y2)

                        box_w = x2 - x1
                        box_h = y2 - y1
                        if box_w <= 10 or box_h <= 15:
                            continue

                        crop = frame[y1:y2, x1:x2]
                        sharpness = self.compute_sharpness(crop)

                        detections.append({
                            "classId": cls_id,
                            "label": "person" if cls_id == 0 else "ball",
                            "confidence": round(conf, 3),
                            "sharpness": sharpness,
                            "box": {
                                "x": round(x1 / width, 4),
                                "y": round(y1 / height, 4),
                                "w": round(box_w / width, 4),
                                "h": round(box_h / height, 4),
                            },
                            "pixelBox": [x1, y1, x2, y2],
                        })
            return detections
        except Exception as e:
            logger.warning(f"[PlayerDetector] YOLO inference error ({e}). Falling back to CPU lightweight.")
            return self._detect_lightweight(frame, width, height)

    def _detect_lightweight(self, frame: Any, width: int, height: int) -> List[Dict[str, Any]]:
        """
        Lightweight CPU mode: Adaptive thresholding, edge filtering, and humanoid aspect ratio analysis.
        Runs efficiently without GPU dependencies or neural network overhead.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        edges = cv2.Canny(blurred, 40, 130)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        min_area = (width * height) * 0.001
        max_area = (width * height) * 0.20

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area <= area <= max_area:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(h) / max(1, w)

                # Upright human athlete aspect ratio (typically 1.4 to 4.5)
                if 1.3 <= aspect_ratio <= 4.8:
                    x1, y1 = max(0, x), max(0, y)
                    x2, y2 = min(width, x + w), min(height, y + h)
                    crop = frame[y1:y2, x1:x2]
                    sharpness = self.compute_sharpness(crop)

                    detections.append({
                        "classId": 0,
                        "label": "person",
                        "confidence": 0.75,
                        "sharpness": sharpness,
                        "box": {
                            "x": round(float(x1) / width, 4),
                            "y": round(float(y1) / height, 4),
                            "w": round(float(x2 - x1) / width, 4),
                            "h": round(float(y2 - y1) / height, 4),
                        },
                        "pixelBox": [x1, y1, x2, y2],
                    })

        # Sort by sharpness * area and keep up to 26 candidate detections per frame
        detections.sort(key=lambda d: d["sharpness"] * (d["box"]["w"] * d["box"]["h"]), reverse=True)
        return detections[:26]


detector = PlayerDetector()
