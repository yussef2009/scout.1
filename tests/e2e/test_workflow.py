import io
import pytest
from fastapi.testclient import TestClient
from services.api.app.main import app

client = TestClient(app)


def test_complete_scout_pipeline_workflow():
    """
    End-to-end integration workflow test:
    1. Check system health & model status
    2. Request upload URL (local fallback)
    3. Upload match video bytes
    4. Detect players using CV/Gemini Vision
    5. Generate structured scouting report
    6. Verify report is persisted in database and queryable by slug
    7. Generate and verify PDF export download
    """
    # 1. System Health
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    # 2. Upload URL
    url_res = client.post("/api/v1/videos/upload-url", data={"filename": "match_clip_1080p.mp4"})
    assert url_res.status_code == 200
    upload_data = url_res.json()
    assert "uploadUrl" in upload_data

    # 3. Direct local upload
    dummy_video_bytes = b"\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08free"
    files = {"file": ("test_clip.mp4", io.BytesIO(dummy_video_bytes), "video/mp4")}
    upload_res = client.post("/api/v1/videos/upload-local", files=files)
    assert upload_res.status_code == 200
    video_info = upload_res.json()
    assert video_info["status"] == "success"
    assert "publicUrl" in video_info

    # 4. Player Detection
    detect_payload = {
        "sport": "football",
        "framesBase64": ["/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP..."],
    }
    detect_res = client.post("/api/v1/videos/detect-players", json=detect_payload)
    assert detect_res.status_code == 200
    detect_data = detect_res.json()
    assert detect_data["playerCount"] >= 1
    players = detect_data["players"]
    assert len(players) > 0

    target_player = players[0]
    assert target_player["id"] == "P1"

    # 5. Full Tactical Analysis Generation
    analysis_payload = {
        "sport": "football",
        "position": target_player.get("position", "Attacking Midfielder"),
        "selectedPlayerId": target_player["id"],
        "playerContext": target_player,
        "language": "en",
        "telemetry": {
            "topSpeedKmh": 31.2,
            "distanceCoveredMeters": 9800.0,
            "sprintCount": 24,
        },
    }
    analysis_res = client.post("/api/v1/analysis/generate", json=analysis_payload)
    assert analysis_res.status_code == 200
    analysis_data = analysis_res.json()

    report = analysis_data["report"]
    slug = analysis_data["shareableSlug"]

    assert 0 <= report["overallScore"] <= 100
    assert report["overallGrade"] in ["S", "A", "B", "C", "D"]
    assert len(report["strengths"]) >= 1
    assert len(report["weaknesses"]) >= 1
    assert len(report["recommendedDrills"]) >= 1

    # 6. Retrieve Persisted Report
    get_res = client.get(f"/api/v1/analysis/reports/{slug}")
    assert get_res.status_code == 200
    saved_report = get_res.json()
    assert saved_report["overallScore"] == report["overallScore"]

    # 7. PDF Export
    pdf_res = client.get(f"/api/v1/analysis/reports/{slug}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500  # valid PDF binary content
