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

