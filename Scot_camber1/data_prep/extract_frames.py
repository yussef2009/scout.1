#!/usr/bin/env python3
"""
SCOT AI - Frame Extraction Module
Extracts high-fidelity frames from sports video broadcasts with dynamic FPS sampling,
temporal clipping, and sequential zero-padded naming for CV training and inference.
"""

import argparse
import json
import logging
import math
import os
import sys
from pathlib import Path
from typing import Dict, Optional, Tuple

import cv2

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("scot_extractor")

# Recommended sampling rates for sports motion dynamics
SPORT_DEFAULT_FPS: Dict[str, float] = {
    "volleyball": 10.0,  # High-speed rallies, spikes, sets
    "basketball": 6.0,   # Fast transition and shot mechanics
    "football": 2.0,     # Broad field movements and spatial tactical maps
    "default": 5.0,
}


def get_video_metadata(cap: cv2.VideoCapture) -> Tuple[int, float, float, int, int]:
    """
    Extracts underlying container properties from cv2.VideoCapture.
    Returns: (total_frames, source_fps, duration_sec, width, height)
    """
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    source_fps = float(cap.get(cv2.CAP_PROP_FPS))
    if source_fps <= 0.0:
        source_fps = 30.0  # Safe fallback for variable frame-rate streams

    duration_sec = total_frames / source_fps if source_fps > 0 else 0.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    return total_frames, source_fps, duration_sec, width, height


def extract_frames(
    video_path: str,
    output_dir: str,
    target_fps: Optional[float] = None,
    sport: str = "volleyball",
    start_sec: float = 0.0,
    end_sec: Optional[float] = None,
    max_frames: Optional[int] = None,
    quality: int = 95,
) -> Dict[str, any]:
    """
    Extracts frames with accurate temporal strides using OpenCV.
    """
    video_file = Path(video_path)
    if not video_file.is_file():
        raise FileNotFoundError(f"Source video not found: {video_path}")

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_file))
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video stream: {video_path}")

    total_frames, source_fps, duration_sec, width, height = get_video_metadata(cap)
    effective_fps = target_fps if target_fps is not None else SPORT_DEFAULT_FPS.get(sport.lower(), 5.0)

    # Frame step stride calculation
    step = max(1, int(round(source_fps / effective_fps)))

    # Boundaries in frame numbers
    start_frame = max(0, int(start_sec * source_fps))
    if end_sec is not None and end_sec > start_sec:
        end_frame = min(total_frames, int(end_sec * source_fps))
    else:
        end_frame = total_frames

    logger.info("=" * 70)
    logger.info("SCOT AI FRAME EXTRACTION PIPELINE")
    logger.info(f"Video Source      : {video_file.name} ({width}x{height})")
    logger.info(f"Native Source FPS : {source_fps:.2f} | Total Frames: {total_frames}")
    logger.info(f"Target Sport      : {sport.upper()} | Sampling FPS: {effective_fps:.2f} (step: {step})")
    logger.info(f"Temporal Window   : {start_sec:.2f}s to {end_frame / source_fps:.2f}s")
    logger.info(f"Output Directory  : {out_path.resolve()}")
    logger.info("=" * 70)

    # Seek directly to start_frame using fast keyframe seeking
    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    current_frame_idx = start_frame
    saved_count = 0
    metadata_manifest = []

    jpeg_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]

    try:
        while current_frame_idx < end_frame:
            ret, frame = cap.read()
            if not ret:
                break

            if (current_frame_idx - start_frame) % step == 0:
                saved_count += 1
                frame_filename = f"frame_{saved_count:05d}.jpg"
                frame_dest = out_path / frame_filename

                cv2.imwrite(str(frame_dest), frame, jpeg_params)

                timestamp_sec = current_frame_idx / source_fps
                metadata_manifest.append({
                    "frame_id": saved_count,
                    "filename": frame_filename,
                    "source_frame_index": current_frame_idx,
                    "timestamp_sec": round(timestamp_sec, 3),
                    "timestamp_formatted": f"{int(timestamp_sec // 60):02d}:{timestamp_sec % 60:05.2f}",
                })

                if saved_count % 50 == 0:
                    logger.info(f"Extracted {saved_count} frames (video time: {timestamp_sec:.2f}s)...")

                if max_frames and saved_count >= max_frames:
                    logger.info(f"Reached requested limit of {max_frames} frames.")
                    break

            current_frame_idx += 1

    finally:
        cap.release()

    # Save manifest for downstream annotation / training
    manifest_path = out_path / "extraction_manifest.json"
    summary_data = {
        "video_source": str(video_file.resolve()),
        "resolution": {"width": width, "height": height},
        "source_fps": source_fps,
        "sampled_fps": effective_fps,
        "stride_step": step,
        "frames_extracted": saved_count,
        "manifest": metadata_manifest,
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    logger.info(f"Extraction complete! Successfully saved {saved_count} frames to {out_path}")
    logger.info(f"Manifest written to {manifest_path}")
    return summary_data


def parse_args():
    parser = argparse.ArgumentParser(
        description="SCOT AI Video Frame Extractor for Sports Analytics & YOLOv11 Training"
    )
    parser.add_argument("--video_path", "-v", type=str, required=True, help="Path to input video file (mp4, avi, mov)")
    parser.add_argument("--output_dir", "-o", type=str, default="./dataset/raw_frames", help="Folder to save frames")
    parser.add_argument("--sport", "-s", type=str, default="volleyball", choices=["volleyball", "basketball", "football"], help="Target sport preset")
    parser.add_argument("--fps", "-f", type=float, default=None, help="Extraction FPS (overrides sport preset)")
    parser.add_argument("--start_sec", type=float, default=0.0, help="Start extraction at seconds mark")
    parser.add_argument("--end_sec", type=float, default=None, help="End extraction at seconds mark (optional)")
    parser.add_argument("--max_frames", "-m", type=int, default=None, help="Cap maximum extracted frames")
    parser.add_argument("--quality", "-q", type=int, default=95, help="JPEG compression quality (1-100)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    extract_frames(
        video_path=args.video_path,
        output_dir=args.output_dir,
        target_fps=args.fps,
        sport=args.sport,
        start_sec=args.start_sec,
        end_sec=args.end_sec,
        max_frames=args.max_frames,
        quality=args.quality,
    )

