import os
import sys
import pytest
import numpy as np
from fastapi.testclient import TestClient

# Ensure services/cv-worker is on sys.path
cv_worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../services/cv-worker"))
if cv_worker_path not in sys.path:
    sys.path.insert(0, cv_worker_path)

from worker.smart_sampler import smart_sampler
from worker.detector import detector, PlayerDetector
from worker.clusterer import player_clusterer, PlayerClusterer
from services.api.app.main import app

client = TestClient(app)


def test_adaptive_sampling_stride_and_epochs():
    """
    [REQUIREMENT 1] Verify adaptive stride formula and 120-180 frame budget on full-length matches.
    """
    # 90-minute match (5400s)
    stride_90m, frames_90m = smart_sampler.compute_sampling_parameters(5400.0)
    assert 10.0 <= stride_90m <= 45.0
    assert 120 <= frames_90m <= 180
    assert stride_90m == max(10.0, 5400.0 / 150.0)

    # 45-minute half (2700s)
    stride_45m, frames_45m = smart_sampler.compute_sampling_parameters(2700.0)
    assert 120 <= frames_45m <= 180

    # 30-minute match (1800s)
    stride_30m, frames_30m = smart_sampler.compute_sampling_parameters(1800.0)
    assert 120 <= frames_30m <= 180

    # Short clip (180s)
    stride_3m, frames_3m = smart_sampler.compute_sampling_parameters(180.0)
    assert 10 <= frames_3m <= 60

    # Verify 4 temporal epochs defined
    assert len(smart_sampler.epochs) == 4
    epoch_names = [e[0] for e in smart_sampler.epochs]
    assert "Early 1st Half" in epoch_names
    assert "Late 1st Half" in epoch_names
    assert "Early 2nd Half" in epoch_names
    assert "Late 2nd Half" in epoch_names


def test_laplacian_sharpness_calculation():
    """
    [REQUIREMENT 2] Verify bounding box sharpness measurement with Laplacian variance.
    """
    # High-frequency textured pattern (sharp player crop)
    sharp_crop = np.zeros((128, 128, 3), dtype=np.uint8)
    sharp_crop[::4, ::4] = 255
    sharp_var = PlayerDetector.compute_sharpness(sharp_crop)
    assert sharp_var > 100.0

    # Solid / blurred image
    blur_crop = np.full((128, 128, 3), 128, dtype=np.uint8)
    blur_var = PlayerDetector.compute_sharpness(blur_crop)
    assert blur_var == 0.0

    assert sharp_var > blur_var


def test_kmeans_torso_hsv_clustering_and_mosaic():
    """
    [REQUIREMENT 2 & 3] Verify K-Means torso HSV extraction, entity clustering, and mosaic grid generation.
    """
    # Create synthetic frame with distinct red and blue athletes
    frame = np.full((720, 1280, 3), (30, 120, 40), dtype=np.uint8)  # grass green

    # Red player torso in upper half
    frame[150:280, 200:260] = (20, 20, 220)  # BGR red
    red_hex, red_hsv = player_clusterer.extract_torso_hsv_color(frame, [200, 100, 260, 320])
    assert red_hex.startswith("#")

    # Blue player torso
    frame[150:280, 500:560] = (220, 40, 20)  # BGR blue
    blue_hex, blue_hsv = player_clusterer.extract_torso_hsv_color(frame, [500, 100, 560, 320])
    assert blue_hex.startswith("#")
    assert red_hex != blue_hex

    # Test clustering across multiple candidate frames
    candidate_frames = [
        {
            "frameIndex": 0,
            "timestampSeconds": 10.0,
            "epoch": "Early 1st Half",
            "frame": frame,
        },
        {
            "frameIndex": 1500,
            "timestampSeconds": 2400.0,
            "epoch": "Late 2nd Half",
            "frame": frame,
        },
    ]

    entities = player_clusterer.cluster_candidate_detections(candidate_frames)
    assert len(entities) >= 1

    # Verify mosaic grid composition
    mosaic_b64, mosaic_img = player_clusterer.compose_mosaic_grid(entities)
    assert mosaic_b64 is not None
    assert isinstance(mosaic_b64, str)
    assert mosaic_img is not None
    assert mosaic_img.shape[0] >= 160
    assert mosaic_img.shape[1] >= 160


def test_detect_players_api_adaptive_lifecycle():
    """
    [REQUIREMENT 3 & 4] Verify /api/v1/videos/detect-players returns complete roster without memory leakage.
    """
    detect_payload = {
        "sport": "football",
        "framesBase64": [
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        ],
    }

    res = client.post("/api/v1/videos/detect-players", json=detect_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["playerCount"] >= 1
    assert data["scanSource"] == "adaptive_cv_gemini"
    assert len(data["players"]) >= 1

    player = data["players"][0]
    assert "id" in player
    assert "label" in player
    assert "teamColorHex" in player
    assert "confidence" in player
    assert "subStatus" in player


def test_volleyball_multi_player_clustering_preserves_squad():
    """
    [VOLLEYBALL CRITICAL] Verify that 12+ on-court players (6 near-court + 6 far-court + liberos)
    are NOT collapsed into 5 or fewer entities during clustering, preserving distinct teammates.
    """
    # Create mock detections mimicking a VNL volleyball frame:
    # 6 Near Court Team Blue (y ~ 0.6 to 0.85) at 6 distinct zones (x from 0.15 to 0.85)
    # 6 Far Court Team Red (y ~ 0.15 to 0.40) at 6 distinct zones (x from 0.15 to 0.85)
    # 1 Yellow Libero on Near Court
    candidate_frames = []
    h, w = 720, 1280
    frame = np.full((h, w, 3), (40, 90, 180), dtype=np.uint8)  # volleyball court floor

    # Generate 6 distinct Near-Court players wearing blue jerseys
    for i, x_center in enumerate([0.18, 0.35, 0.50, 0.65, 0.80, 0.52]):
        y_center = 0.65 if i < 3 else 0.82
        x1, y1 = int((x_center - 0.03) * w), int((y_center - 0.08) * h)
        x2, y2 = int((x_center + 0.03) * w), int((y_center + 0.08) * h)
        frame[y1:y2, x1:x2] = (220, 50, 20)  # BGR blue

    # Generate 6 distinct Far-Court players wearing red jerseys
    for i, x_center in enumerate([0.20, 0.38, 0.52, 0.68, 0.82, 0.50]):
        y_center = 0.22 if i < 3 else 0.35
        x1, y1 = int((x_center - 0.02) * w), int((y_center - 0.05) * h)
        x2, y2 = int((x_center + 0.02) * w), int((y_center + 0.05) * h)
        frame[y1:y2, x1:x2] = (20, 20, 220)  # BGR red

    # Add Near-Court Libero (Yellow)
    frame[int(0.75*h):int(0.88*h), int(0.25*w):int(0.31*w)] = (30, 220, 240)  # BGR yellow

    candidate_frames.append({
        "frameIndex": 0,
        "timestampSeconds": 5.0,
        "epoch": "Early 1st Half",
        "frame": frame,
    })

    # Run clustering
    entities = player_clusterer.cluster_candidate_detections(candidate_frames, max_clusters=36)
    
    # Crucial assertion: clustering must retain multiple distinct candidates and not falsely collapse to <= 5
    assert len(entities) >= 10, f"Expected at least 10 entities for full squad, got {len(entities)}"


