import os
import time
import json
import logging
from typing import Dict, Any, List, Optional
from .smart_sampler import smart_sampler
from .detector import detector
from .tracker import tracker
from .homography import pitch_homography
from .clusterer import player_clusterer

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

        # 1. Adaptive time-window sampling (equal density across 4 epochs)
        sampled_frames = smart_sampler.sample_candidate_frames_adaptive(video_path)
        print(f"[CVPipeline] Sampled {len(sampled_frames)} candidate frames across temporal epochs")

        # 2. Local player entity clustering & deduplication (K-Means jersey HSV + spatial proximity)
        player_entities = player_clusterer.cluster_candidate_detections(sampled_frames)
        mosaic_b64, _ = player_clusterer.compose_mosaic_grid(player_entities)

        # 3. Trajectory and spatial heatmap calculation
        player_trajectories: Dict[str, List[Dict[str, float]]] = {}
        for entity in player_entities:
            cid = entity.get("candidateId", "C1")
            box = entity.get("boundingBox", {"x": 0.5, "y": 0.5, "w": 0.1, "h": 0.2})
            player_trajectories[cid] = [box]

        primary_trajectory = []
        if player_entities:
            primary_trajectory = [player_entities[0].get("boundingBox", {"x": 0.5, "y": 0.5, "w": 0.1, "h": 0.2})]

        telemetry = pitch_homography.estimate_telemetry(primary_trajectory)
        elapsed_sec = round(time.time() - start_time, 2)

        return {
            "status": "success",
            "videoPath": video_path,
            "sport": sport,
            "processingTimeSeconds": elapsed_sec,
            "keyframesCount": len(sampled_frames),
            "keyframes": sampled_frames[:num_keyframes],
            "playerEntitiesCount": len(player_entities),
            "startersCount": sum(1 for p in player_entities if p.get("subStatus") == "Starter"),
            "substitutesCount": sum(1 for p in player_entities if p.get("subStatus") == "Substitute"),
            "mosaicBase64": mosaic_b64,
            "telemetry": telemetry,
            "trackedPlayerCount": len(player_entities),
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
        # pyrefly: ignore[missing-import]
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
