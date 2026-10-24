from fastapi.testclient import TestClient
from services.api.app.main import app

client = TestClient(app)


def test_health_check_root():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "scoutai-api"
    assert data["version"] == "2.0.0"


def test_health_check_v1():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
