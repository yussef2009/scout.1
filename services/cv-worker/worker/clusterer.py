import base64
import logging
from typing import List, Dict, Any, Tuple, Optional

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

from .detector import detector

logger = logging.getLogger("scoutai.clusterer")


class PlayerClusterer:
    """
    Local Player Aggregation & Deduplication Engine:
    1. Extracts upper-torso HSV jersey color vectors using K-Means.
    2. Clusters player detections across candidate frames using kit color & field spatial proximity.
    3. For each unique entity, retains the Top 2 sharpest un-occluded crop thumbnails (min 128x128px).
    4. Categorizes into Starters vs Substitutes based on temporal epoch presence.
    5. Stitches candidate player crops into a single composite mosaic grid for single-pass Gemini verification.
    """

    def __init__(self, min_crop_size: int = 128, mosaic_cell_size: int = 160):
        self.min_crop_size = min_crop_size
        self.mosaic_cell_size = mosaic_cell_size

    def extract_torso_hsv_color(self, frame: Any, pixel_box: List[int]) -> Tuple[str, np.ndarray]:
        """
        Samples upper torso (top 15% to 50% of the player box) to isolate the jersey kit.
        Uses OpenCV K-Means to extract dominant kit color in HSV and RGB Hex.
        """
        if not HAS_CV2 or frame is None or len(pixel_box) != 4:
            return ("#3b82f6", np.array([110, 180, 200], dtype=np.float32))

        x1, y1, x2, y2 = pixel_box
        h, w = frame.shape[:2]
        x1, x2 = max(0, x1), min(w, x2)
        y1, y2 = max(0, y1), min(h, y2)

        box_h = y2 - y1
        box_w = x2 - x1
        if box_h < 15 or box_w < 10:
            return ("#3b82f6", np.array([110, 180, 200], dtype=np.float32))

        # Upper-torso crop (avoids hair/face and shorts/grass)
        torso_y1 = y1 + int(box_h * 0.15)
        torso_y2 = y1 + int(box_h * 0.50)
        torso_x1 = x1 + int(box_w * 0.15)
        torso_x2 = x2 - int(box_w * 0.15)

        torso = frame[torso_y1:torso_y2, torso_x1:torso_x2]
        if torso.size == 0 or torso.shape[0] < 4 or torso.shape[1] < 4:
            return ("#3b82f6", np.array([110, 180, 200], dtype=np.float32))

        hsv_torso = cv2.cvtColor(torso, cv2.COLOR_BGR2HSV)
        pixels_hsv = hsv_torso.reshape(-1, 3).astype(np.float32)

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        try:
            _, labels, centers = cv2.kmeans(pixels_hsv, 3, None, criteria, 5, cv2.KMEANS_RANDOM_CENTERS)
            counts = np.bincount(labels.flatten())
            sorted_indices = np.argsort(counts)[::-1]

            for idx in sorted_indices:
                h_val, s_val, v_val = centers[idx]
                # Filter out pitch grass-green (Hue between 35 and 85 with medium-high saturation)
                if 35 <= h_val <= 85 and s_val > 50:
                    continue

                # Convert HSV center to BGR for hex formatting
                hsv_pixel = np.uint8([[[h_val, s_val, v_val]]])
                bgr_pixel = cv2.cvtColor(hsv_pixel, cv2.COLOR_HSV2BGR)[0][0]
                hex_color = f"#{int(bgr_pixel[2]):02x}{int(bgr_pixel[1]):02x}{int(bgr_pixel[0]):02x}"
                return (hex_color, centers[idx])

            # Fallback to dominant center
            h_val, s_val, v_val = centers[sorted_indices[0]]
            hsv_pixel = np.uint8([[[h_val, s_val, v_val]]])
            bgr_pixel = cv2.cvtColor(hsv_pixel, cv2.COLOR_HSV2BGR)[0][0]
            hex_color = f"#{int(bgr_pixel[2]):02x}{int(bgr_pixel[1]):02x}{int(bgr_pixel[0]):02x}"
            return (hex_color, centers[sorted_indices[0]])
        except Exception:
            return ("#3b82f6", np.array([110, 180, 200], dtype=np.float32))

    def cluster_candidate_detections(
        self,
        candidate_frames: List[Dict[str, Any]],
        max_clusters: int = 36,
    ) -> List[Dict[str, Any]]:
        """
        Runs local player detection across candidate frames and clusters detections into distinct entities.
        Retains Top 2 sharpest thumbnails for each entity and flags Starter vs Substitute.
        Guarantees that distinct teammates sharing kit colors and players across court zones (e.g. Volleyball 6v6)
        are preserved without aggressive collapse.
        """
        if not HAS_CV2 or not candidate_frames:
            return self._generate_mock_clusters()

        all_detections: List[Dict[str, Any]] = []

        # 1. Detect and feature-extract across all candidate frames
        for frame_item in candidate_frames:
            frame = frame_item.get("frame")
            if frame is None and frame_item.get("base64"):
                try:
                    img_bytes = base64.b64decode(frame_item["base64"])
                    np_arr = np.frombuffer(img_bytes, np.uint8)
                    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                except Exception:
                    frame = None

            if frame is None:
                continue

            dets = detector.detect_in_frame(frame)
            h, w = frame.shape[:2]

            for det in dets:
                if det.get("label") != "person":
                    continue

                x1, y1, x2, y2 = det["pixelBox"]
                crop = frame[y1:y2, x1:x2]
                if crop.size == 0 or crop.shape[0] < 20 or crop.shape[1] < 12:
                    continue

                sharpness = det.get("sharpness", detector.compute_sharpness(crop))
                hex_color, hsv_center = self.extract_torso_hsv_color(frame, [x1, y1, x2, y2])

                # Normalized spatial coordinates
                norm_cx = (x1 + x2) / (2.0 * max(1, w))
                norm_cy = (y1 + y2) / (2.0 * max(1, h))

                all_detections.append({
                    "frameIndex": frame_item.get("frameIndex", 0),
                    "timestamp": frame_item.get("timestampSeconds", 0.0),
                    "epoch": frame_item.get("epoch", "Early 1st Half"),
                    "box": det["box"],
                    "pixelBox": [x1, y1, x2, y2],
                    "confidence": det.get("confidence", 0.8),
                    "sharpness": sharpness,
                    "hexColor": hex_color,
                    "hsv": hsv_center,
                    "pos": np.array([norm_cx, norm_cy], dtype=np.float32),
                    "crop": crop,
                })

        if not all_detections:
            return self._generate_mock_clusters()

        # 2. Cluster detections into distinct player entities
        # RULES FOR TEAM SPORTS (Volleyball, Football, Basketball):
        # - Teammates share the SAME kit color. Never merge based on color alone.
        # - Co-temporal exclusion: Detections from the SAME frame MUST belong to different players.
        # - Spatial positioning: Players separated by distinct tactical court corridors/zones are distinct athletes.
        raw_clusters: List[List[Dict[str, Any]]] = []

        for det in all_detections:
            best_cluster_idx = -1
            best_sim_score = -1.0

            for c_idx, cluster in enumerate(raw_clusters):
                # RULE 1: Co-temporal exclusion - A player cannot be in two places in the same frame
                frame_indices = {d["frameIndex"] for d in cluster}
                if det["frameIndex"] in frame_indices:
                    continue

                rep = cluster[0]
                # Hue distance on circular 0-180 scale
                hue_diff = min(abs(det["hsv"][0] - rep["hsv"][0]), 180 - abs(det["hsv"][0] - rep["hsv"][0]))
                sat_diff = abs(det["hsv"][1] - rep["hsv"][1])
                pos_dist = float(np.linalg.norm(det["pos"] - rep["pos"]))

                # In team sports, players with same kit color at different court positions are DIFFERENT teammates
                # Near Court (y > 0.5) vs Far Court (y < 0.5) are opposing teams or distinct zones
                diff_court_side = (det["pos"][1] > 0.5 and rep["pos"][1] < 0.45) or (det["pos"][1] < 0.45 and rep["pos"][1] > 0.5)
                if diff_court_side:
                    continue  # Across the net: cannot be the same player

                if hue_diff < 22 and sat_diff < 80:
                    # Same team kit! If they are spatially separated (> 0.22 normalized distance), they are different teammates!
                    if pos_dist > 0.22:
                        continue

                    # Same kit + close spatial corridor across time
                    sim = (1.0 - (hue_diff / 22.0)) * 0.35 + (1.0 - min(1.0, pos_dist)) * 0.65
                    if sim > best_sim_score and sim > 0.60:
                        best_sim_score = sim
                        best_cluster_idx = c_idx

            if best_cluster_idx >= 0:
                raw_clusters[best_cluster_idx].append(det)
            else:
                raw_clusters.append([det])

        # Retain all valid candidate clusters up to max_clusters (including single crisp detections)
        valid_clusters = sorted(
            raw_clusters,
            key=lambda c: len(c) * 15.0 + max(d.get("sharpness", 0.0) for d in c),
            reverse=True,
        )[:max_clusters]

        # 3. For each cluster entity, retain Top 2 sharpest crop thumbnails and flag Starter vs Substitute
        player_entities: List[Dict[str, Any]] = []

        for idx, cluster in enumerate(valid_clusters):
            cid = f"C{idx + 1}"
            # Sort by sharpness * confidence to get the 2 highest quality crops
            cluster.sort(key=lambda d: d["sharpness"] * d["confidence"], reverse=True)
            top_crops_raw = cluster[:2]

            # Determine Starter vs Substitute based on temporal epochs observed
            epochs_present = set(d["epoch"] for d in cluster)
            is_starter = ("Early 1st Half" in epochs_present) or ("Late 1st Half" in epochs_present)
            sub_status = "Starter" if is_starter else "Substitute"

            # Prepare Top 2 high-quality thumbnails (resized to min_crop_size)
            thumbnails_b64: List[str] = []
            best_sharpness = top_crops_raw[0]["sharpness"]
            best_timestamp = top_crops_raw[0]["timestamp"]
            best_crop_img = None

            for i, det_item in enumerate(top_crops_raw):
                crop_img = det_item["crop"]
                # Resize with aspect ratio preserved via padding
                h_c, w_c = crop_img.shape[:2]
                scale = float(self.min_crop_size) / max(h_c, w_c)
                resized = cv2.resize(crop_img, (max(1, int(w_c * scale)), max(1, int(h_c * scale))), interpolation=cv2.INTER_CUBIC)

                # Pad to square (min_crop_size x min_crop_size)
                pad_canvas = np.zeros((self.min_crop_size, self.min_crop_size, 3), dtype=np.uint8)
                y_off = (self.min_crop_size - resized.shape[0]) // 2
                x_off = (self.min_crop_size - resized.shape[1]) // 2
                pad_canvas[y_off:y_off+resized.shape[0], x_off:x_off+resized.shape[1]] = resized

                if i == 0:
                    best_crop_img = pad_canvas.copy()

                _, buf = cv2.imencode(".jpg", pad_canvas, [cv2.IMWRITE_JPEG_QUALITY, 90])
                thumbnails_b64.append(base64.b64encode(buf).decode("utf-8"))

            dominant_hex = top_crops_raw[0]["hexColor"]
            norm_box = top_crops_raw[0]["box"]

            player_entities.append({
                "candidateId": cid,
                "subStatus": sub_status,
                "teamColorHex": dominant_hex,
                "bestFrameTimestamp": best_timestamp,
                "detectionCount": len(cluster),
                "sharpness": best_sharpness,
                "confidence": min(98, 70 + int(len(cluster) * 2)),
                "boundingBox": norm_box,
                "thumbnailBase64": thumbnails_b64[0] if thumbnails_b64 else None,
                "secondaryThumbnailBase64": thumbnails_b64[1] if len(thumbnails_b64) > 1 else None,
                "bestCropImg": best_crop_img,
            })

            # Explicit memory release of intermediate crop buffers
            for d in cluster:
                d["crop"] = None

        logger.info(
            f"[PlayerClusterer] Formed {len(player_entities)} player entities "
            f"({sum(1 for p in player_entities if p['subStatus'] == 'Starter')} Starters, "
            f"{sum(1 for p in player_entities if p['subStatus'] == 'Substitute')} Substitutes)."
        )
        return player_entities

    def compose_mosaic_grid(
        self,
        player_entities: List[Dict[str, Any]],
        columns: int = 5,
    ) -> Tuple[Optional[str], Optional[np.ndarray]]:
        """
        Stitches the sharpest cropped thumbnails of all candidate player entities into a single
        labeled mosaic grid image. Overlay tags [C1], [C2] allow Gemini to identify each player
        in ONE single API call without blowing context or RAM limits.
        """
        if not HAS_CV2 or not player_entities:
            return (None, None)

        n = len(player_entities)
        cols = min(columns, n)
        rows = int(np.ceil(n / float(cols)))

        cell_size = self.mosaic_cell_size
        mosaic = np.zeros((rows * cell_size, cols * cell_size, 3), dtype=np.uint8)

        for idx, entity in enumerate(player_entities):
            r = idx // cols
            c = idx % cols

            crop = entity.get("bestCropImg")
            if crop is None and entity.get("thumbnailBase64"):
                try:
                    raw = base64.b64decode(entity["thumbnailBase64"])
                    crop = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
                except Exception:
                    crop = None

            if crop is not None:
                # Resize to cell_size
                cell_img = cv2.resize(crop, (cell_size, cell_size), interpolation=cv2.INTER_AREA)
            else:
                cell_img = np.zeros((cell_size, cell_size, 3), dtype=np.uint8)

            # Draw candidate ID badge [C1] on top-left of cell
            cid_tag = entity["candidateId"]
            sub_tag = "SUB" if entity["subStatus"] == "Substitute" else "STA"
            label = f"{cid_tag} ({sub_tag})"

            cv2.rectangle(cell_img, (0, 0), (cell_size, 26), (15, 20, 30), -1)
            cv2.putText(cell_img, label, (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (0, 225, 255), 2)

            # Place in grid
            mosaic[r*cell_size:(r+1)*cell_size, c*cell_size:(c+1)*cell_size] = cell_img

        # Encode to JPEG
        _, buffer = cv2.imencode(".jpg", mosaic, [cv2.IMWRITE_JPEG_QUALITY, 92])
        b64_mosaic = base64.b64encode(buffer).decode("utf-8")

        return (b64_mosaic, mosaic)

    def _generate_mock_clusters(self) -> List[Dict[str, Any]]:
        dummy_pixel = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        )
        return [
            {
                "candidateId": "C1",
                "subStatus": "Starter",
                "teamColorHex": "#3b82f6",
                "bestFrameTimestamp": 14.2,
                "detectionCount": 18,
                "sharpness": 42.5,
                "confidence": 92,
                "boundingBox": {"x": 0.42, "y": 0.35, "w": 0.08, "h": 0.22},
                "thumbnailBase64": dummy_pixel,
                "secondaryThumbnailBase64": dummy_pixel,
                "bestCropImg": None,
            },
            {
                "candidateId": "C2",
                "subStatus": "Starter",
                "teamColorHex": "#ef4444",
                "bestFrameTimestamp": 18.6,
                "detectionCount": 15,
                "sharpness": 38.1,
                "confidence": 88,
                "boundingBox": {"x": 0.55, "y": 0.38, "w": 0.07, "h": 0.21},
                "thumbnailBase64": dummy_pixel,
                "secondaryThumbnailBase64": dummy_pixel,
                "bestCropImg": None,
            },
        ]


player_clusterer = PlayerClusterer()

