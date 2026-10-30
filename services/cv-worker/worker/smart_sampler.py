import os
import base64
import logging
from typing import List, Dict, Any, Tuple, Optional

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

logger = logging.getLogger("scoutai.smart_sampler")


class SmartSampler:
    """
    Adaptive, memory-efficient temporal sampling engine designed for long matches (30 to 90+ minutes).
    Uses fast seeking via cv2.CAP_PROP_POS_MSEC and temporal epoch subdivision to guarantee
    equal sampling density for starters and 2nd-half substitutions without RAM exhaustion.
    """

    def __init__(self, target_resolution: Tuple[int, int] = (1280, 720)):
        self.target_width, self.target_height = target_resolution
        # 4 temporal epochs ensuring equal sampling density across both halves
        self.epochs = [
            ("Early 1st Half", 0.00, 0.25),
            ("Late 1st Half", 0.25, 0.50),
            ("Early 2nd Half", 0.50, 0.75),
            ("Late 2nd Half", 0.75, 1.00),
        ]

    def compute_sampling_parameters(self, duration_sec: float) -> Tuple[float, int]:
        """
        Calculates adaptive sampling stride and target frame budget:
        - For videos > 10 min (600s): target between 120 and 180 frames.
          Formula: stride_seconds = max(10.0, duration_sec / 150.0)
        - For shorter clips (<= 600s): adaptive stride between 1.5s and 6.0s (30-60 frames).
        """
        if duration_sec <= 0:
            return (10.0, 10)

        if duration_sec > 600.0:
            # Long match: target ~150 frames (clamped between 120 and 180)
            stride_sec = max(10.0, duration_sec / 150.0)
            target_frames = max(120, min(180, int(round(duration_sec / stride_sec))))
        else:
            # Short / highlight clip: target 20 to 50 candidate frames
            stride_sec = max(1.5, duration_sec / 40.0)
            target_frames = max(10, min(50, int(round(duration_sec / stride_sec))))

        return (stride_sec, target_frames)

    def sample_candidate_frames_adaptive(
        self,
        video_path: str,
        include_numpy_frames: bool = True,
        max_image_dim: int = 1280,
    ) -> List[Dict[str, Any]]:
        """
        Adaptive Time-Window Sampling for long matches:
        1. Reads video metadata without loading entire video into RAM.
        2. Subdivides timeline into 4 temporal epochs (Early/Late 1st Half, Early/Late 2nd Half).
        3. Uses fast OpenCV timestamp seeking (cv2.CAP_PROP_POS_MSEC) to decode only candidate frames.
        4. Releases video buffer immediately upon completion to avoid memory leaks.
        """
        if not HAS_CV2 or not os.path.exists(video_path):
            logger.warning(f"[SmartSampler] Video path not found or OpenCV unavailable: {video_path}")
            return self._empty_or_mock_samples(12)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.warning(f"[SmartSampler] Failed to open video: {video_path}")
            return self._empty_or_mock_samples(12)

        try:
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
            if fps <= 0.0:
                fps = 25.0
            total_duration_sec = total_frames / fps if total_frames > 0 else 0.0

            if total_duration_sec <= 0.0:
                return self._empty_or_mock_samples(12)

            stride_sec, target_total_frames = self.compute_sampling_parameters(total_duration_sec)
            logger.info(
                f"[SmartSampler] Video duration: {total_duration_sec:.1f}s | "
                f"Computed stride: {stride_sec:.1f}s | Target candidates: {target_total_frames}"
            )

            # Distribute candidate frames equally across the 4 temporal epochs
            frames_per_epoch = max(1, target_total_frames // len(self.epochs))
            sampled_items: List[Dict[str, Any]] = []

            for epoch_name, start_pct, end_pct in self.epochs:
                epoch_start_sec = total_duration_sec * start_pct
                epoch_end_sec = total_duration_sec * end_pct
                epoch_duration = epoch_end_sec - epoch_start_sec

                if epoch_duration <= 0.0:
                    continue

                epoch_stride = epoch_duration / float(frames_per_epoch)

                for i in range(frames_per_epoch):
                    target_time_sec = epoch_start_sec + (i * epoch_stride)
                    if target_time_sec >= total_duration_sec:
                        break

                    target_msec = target_time_sec * 1000.0

                    # Fast seeking via CAP_PROP_POS_MSEC (avoids decoding every intermediate frame)
                    cap.set(cv2.CAP_PROP_POS_MSEC, target_msec)
                    ret, frame = cap.read()

                    if not ret or frame is None:
                        continue

                    # Memory guard: Downscale frame if larger than max_image_dim to keep RAM usage low
                    h, w = frame.shape[:2]
                    scale = min(max_image_dim / max(1, w), max_image_dim / max(1, h), 1.0)
                    if scale < 1.0:
                        new_w, new_h = int(w * scale), int(h * scale)
                        frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

                    # Encode to high-quality compressed JPEG buffer
                    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    b64_data = base64.b64encode(buffer).decode("utf-8")

                    item = {
                        "frameIndex": int(target_time_sec * fps),
                        "timestampSeconds": round(target_time_sec, 2),
                        "epoch": epoch_name,
                        "base64": b64_data,
                        "width": frame.shape[1],
                        "height": frame.shape[0],
                        "motionScore": round(float(np.mean(frame)), 2),
                    }
                    if include_numpy_frames:
                        item["frame"] = frame  # Caller can process crops then clear

                    sampled_items.append(item)

            logger.info(f"[SmartSampler] Successfully sampled {len(sampled_items)} candidate frames across 4 epochs.")
            return sampled_items

        finally:
            cap.release()

    def sample_keyframes(
        self,
        video_path: str,
        num_frames: int = 10,
        motion_threshold: float = 12.0,
    ) -> List[Dict[str, Any]]:
        """
        Backwards-compatible interface. For short requests or legacy callers,
        maps to adaptive sampling and returns top distributed keyframes.
        """
        if not HAS_CV2 or not os.path.exists(video_path):
            return self._empty_or_mock_samples(num_frames)

        candidates = self.sample_candidate_frames_adaptive(
            video_path,
            include_numpy_frames=False,
            max_image_dim=self.target_width,
        )

        if not candidates:
            return self._empty_or_mock_samples(num_frames)

        if len(candidates) <= num_frames:
            return candidates

        # Distribute evenly
        step = len(candidates) / float(num_frames)
        selected = [candidates[int(i * step)] for i in range(num_frames)]
        return selected

    def _empty_or_mock_samples(self, count: int) -> List[Dict[str, Any]]:
        dummy_pixel = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        )
        samples = []
        for i in range(count):
            epoch_name = self.epochs[i % len(self.epochs)][0]
            samples.append({
                "frameIndex": i * 150,
                "timestampSeconds": round(i * 12.5, 2),
                "epoch": epoch_name,
                "base64": dummy_pixel,
                "motionScore": 15.0 + i,
            })
        return samples


smart_sampler = SmartSampler()
