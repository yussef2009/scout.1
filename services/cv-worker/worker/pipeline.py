import os
import time
import json
import logging
from typing import Dict, Any, List, Optional
from .smart_sampler import smart_sampler
from .detector import detector
from .tracker import tracker
from .homography import pitch_homography

logger = logging.getLogger("scoutai.cv_worker")


class CVPipeline:
    """
    End-to-End Computer Vision Pipeline:
    Video Input -> Smart Motion Sampling -> Player Detection ->
    ByteTrack Persistent ID -> Jersey Color K-Means -> 2D Pitch Projection & Heatmap.
    """

    def __init__(self, mode: Optional[str] = None):
        self.mode = mode or os.getenv("CV_MODE", "lightweight")

    def process_video(
        self,
        video_path: str,
        sport: str = "football",
        num_keyframes: int = 10,
    ) -> Dict[str, Any]:
        start_time = time.time()
        print(f"[CVPipeline] Starting processing for video: {video_path} (mode: {self.mode})")

        # 1. Smart motion sampling
        sampled_frames = smart_sampler.sample_keyframes(video_path, num_frames=num_keyframes)
        print(f"[CVPipeline] Sampled {len(sampled_frames)} motion-aware keyframes")

        # 2. Player detection and tracking across sampled frames
        all_detections = []
        player_trajectories: Dict[int, List[Dict[str, float]]] = {}

        for frame_item in sampled_frames:
            # If we have base64 data, decode into OpenCV image
            raw_b64 = frame_item.get("base64")
            if raw_b64 and __import__("cv2"):
                import cv2
                import numpy as np
                import base64

                img_bytes = base64.b64decode(raw_b64)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                # Run detector
                dets = detector.detect_in_frame(frame)
                # Run tracker
                tracks = tracker.update(dets, frame)

                for tr in tracks:
                    tid = tr["trackId"]
                    if tid not in player_trajectories:
                        player_trajectories[tid] = []
                    player_trajectories[tid].append(tr["box"])

                all_detections.append(tracks)

        # 3. Calculate telemetry and spatial heatmap for primary tracked player
        primary_trajectory = []
        if player_trajectories:
            # Pick longest tracked player
            longest_tid = max(player_trajectories.keys(), key=lambda k: len(player_trajectories[k]))
            primary_trajectory = player_trajectories[longest_tid]

        telemetry = pitch_homography.estimate_telemetry(primary_trajectory)
        elapsed_sec = round(time.time() - start_time, 2)

        return {
            "status": "success",
            "videoPath": video_path,
            "sport": sport,
            "processingTimeSeconds": elapsed_sec,
            "keyframesCount": len(sampled_frames),
            "keyframes": sampled_frames,
            "telemetry": telemetry,
            "trackedPlayerCount": len(player_trajectories),
        }


cv_pipeline = CVPipeline()


def run_worker_daemon():
    """
    Long-running daemon process that keeps the CV worker active,
    processes queued video analysis tasks from Redis, and handles termination signals gracefully.
    """
    import signal
    import sys

    running = True

    def _signal_handler(signum, frame):
        nonlocal running
        print(f"[CVWorker] Received signal {signum}, initiating graceful shutdown...")
        running = False

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = None

    try:
        import redis
        client = redis.from_url(redis_url, socket_timeout=3, socket_connect_timeout=3)
        client.ping()
        redis_client = client
        print(f"[CVWorker] Connected to Redis queue at {redis_url}")
    except Exception as exc:
        print(f"[CVWorker Info] Redis not reachable ({exc}). Operating in standalone/polling mode.")

    print(f"[CVWorker] Hybrid Computer Vision Worker started (Mode: {os.getenv('CV_MODE', 'lightweight')})")
    print("[CVWorker] Ready and awaiting processing jobs from pipeline queue...")

    while running:
        try:
            if redis_client:
                # Block for 2 seconds waiting for queued CV jobs
                job_raw = redis_client.brpop("scoutai:cv_jobs", timeout=2)
                if job_raw:
                    _, payload_str = job_raw
                    try:
                        job_data = json.loads(payload_str.decode("utf-8") if isinstance(payload_str, bytes) else payload_str)
                        job_id = job_data.get("job_id", "unknown")
                        video_path = job_data.get("video_path", "")
                        sport = job_data.get("sport", "football")

                        print(f"[CVWorker] Consuming job {job_id} for video: {video_path}")
                        result = cv_pipeline.process_video(video_path=video_path, sport=sport)

                        # Write back result with 24-hour expiration
                        redis_client.setex(
                            f"scoutai:cv_job_results:{job_id}",
                            86400,
                            json.dumps(result),
                        )
                        print(f"[CVWorker] Job {job_id} completed successfully.")
                    except Exception as job_err:
                        print(f"[CVWorker Error] Failed processing job: {job_err}")
            else:
                # Standby poll interval
                time.sleep(2)
        except (KeyboardInterrupt, SystemExit):
            break
        except Exception as loop_err:
            print(f"[CVWorker Warning] Loop encounter: {loop_err}")
            time.sleep(2)

    print("[CVWorker] Worker stopped gracefully.")
    sys.exit(0)


if __name__ == "__main__":
    run_worker_daemon()
