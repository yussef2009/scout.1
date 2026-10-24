import os
from typing import List, Dict, Any, Optional

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False


class PlayerDetector:
    """
    Hybrid Player & Sports Ball Detector.
    Supports YOLOv11 (GPU/CPU) and graceful lightweight fallback mode (OpenCV contour/motion).
    """

    def __init__(self, mode: str = "lightweight", model_name: str = "yolo11n.pt"):
        self.mode = mode.lower()
        self.model_name = model_name
        self.yolo_model = None

        if self.mode != "lightweight" and HAS_YOLO:
            try:
                self.yolo_model = YOLO(self.model_name)
                print(f"[PlayerDetector] Initialized YOLO model: {self.model_name}")
            except Exception as e:
                print(f"[PlayerDetector Warning] Could not load YOLO ({e}). Falling back to lightweight CPU mode.")
                self.mode = "lightweight"
        else:
            self.mode = "lightweight"

    def detect_in_frame(self, frame: Any) -> List[Dict[str, Any]]:
        """
        Detects players and sports ball in a single image/frame.
        Returns list of detections with normalized bounding boxes: {x, y, w, h, class_id, confidence}
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
        results = self.yolo_model(frame, verbose=False)
        detections = []

        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())

                # Filter: Person (0) or Sports Ball (32)
                if cls_id in (0, 32) and conf >= 0.35:
                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = xyxy

                    # Normalize coordinates to [0, 1]
                    norm_x = max(0.0, min(1.0, x1 / width))
                    norm_y = max(0.0, min(1.0, y1 / height))
                    norm_w = max(0.0, min(1.0, (x2 - x1) / width))
                    norm_h = max(0.0, min(1.0, (y2 - y1) / height))

                    detections.append({
                        "classId": cls_id,
                        "label": "person" if cls_id == 0 else "ball",
                        "confidence": round(conf, 3),
                        "box": {
                            "x": round(norm_x, 4),
                            "y": round(norm_y, 4),
                            "w": round(norm_w, 4),
                            "h": round(norm_h, 4),
                        },
                        "pixelBox": [int(x1), int(y1), int(x2), int(y2)],
                    })
        return detections

    def _detect_lightweight(self, frame: Any, width: int, height: int) -> List[Dict[str, Any]]:
        """
        Lightweight CPU mode: Uses adaptive thresholding and contour aspect ratio analysis
        to estimate player bounding boxes without heavy neural network overhead.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        edges = cv2.Canny(blurred, 50, 150)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        min_area = (width * height) * 0.003
        max_area = (width * height) * 0.25

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area <= area <= max_area:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(h) / max(1, w)

                # Upright human silhouette aspect ratio typically between 1.4 and 4.2
                if 1.3 <= aspect_ratio <= 4.5:
                    detections.append({
                        "classId": 0,
                        "label": "person",
                        "confidence": 0.72,
                        "box": {
                            "x": round(float(x) / width, 4),
                            "y": round(float(y) / height, 4),
                            "w": round(float(w) / width, 4),
                            "h": round(float(h) / height, 4),
                        },
                        "pixelBox": [x, y, x + w, y + h],
                    })

        # Limit to top 15 candidates
        return detections[:15]


detector = PlayerDetector(mode=os.getenv("CV_MODE", "lightweight"))
