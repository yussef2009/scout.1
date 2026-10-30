import os
import uuid
import json
import subprocess
import concurrent.futures
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.models.database import SessionLocal, engine
from services.api.app.models.organization import Organization
from services.api.app.models.user import User
from services.api.app.models.player import Player
from services.api.app.models.match import MatchVideo
from services.api.app.models.report import ScoutingReport
from services.api.app.models.usage_meter import UsageMeter
from services.api.app.services.usage_service import usage_service
from services.api.app.services.paymob_service import paymob_service
from services.api.app.dependencies.security import hash_password, verify_password, create_access_token
from services.api.app.config import settings

client = TestClient(app)


# ============================================================================
# 1. PRIVACY PILLAR
# ============================================================================

def test_privacy_cross_tenant_isolation():
    """
    [PRIVACY] Verify that Organization A cannot inspect, list, or access Organization B's athletes.
    """
    db = SessionLocal()
    org_a = Organization(name="Privacy Club A", slug=f"priv-a-{uuid.uuid4().hex[:6]}", subscription_tier="PRO")
    org_b = Organization(name="Privacy Club B", slug=f"priv-b-{uuid.uuid4().hex[:6]}", subscription_tier="PRO")
    db.add(org_a)
    db.add(org_b)
    db.commit()
    db.refresh(org_a)
    db.refresh(org_b)

    user_a = User(
        email=f"scout_a_{uuid.uuid4().hex[:6]}@org-a.com",
        hashed_password=hash_password("SecretPass123!"),
        full_name="Scout A",
        org_id=org_a.id,
    )
    user_b = User(
        email=f"scout_b_{uuid.uuid4().hex[:6]}@org-b.com",
        hashed_password=hash_password("SecretPass123!"),
        full_name="Scout B",
        org_id=org_b.id,
    )
    db.add(user_a)
    db.add(user_b)
    db.commit()
    db.refresh(user_a)
    db.refresh(user_b)

    player_b = Player(
        slug=f"athlete-b-{uuid.uuid4().hex[:6]}",
        first_name="Athlete",
        last_name="Private B",
        primary_sport="football",
        org_id=org_b.id,
    )
    db.add(player_b)
    db.commit()
    db.refresh(player_b)

    token_a = create_access_token(user_a.id, org_a.id)
    token_b = create_access_token(user_b.id, org_b.id)

    prev_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"
    try:
        # Org A requests list: must NOT contain Player B
        res_list = client.get("/api/v1/players", headers={"Authorization": f"Bearer {token_a}"})
        assert res_list.status_code == 200
        players = res_list.json()
        assert all(p["id"] != player_b.id for p in players), "CRITICAL PRIVACY BREACH: Org A saw Org B's player!"

        # Org A attempts direct slug retrieval of Org B player: must return 404
        res_slug = client.get(f"/api/v1/players/{player_b.slug}", headers={"Authorization": f"Bearer {token_a}"})
        assert res_slug.status_code == 404, "CRITICAL PRIVACY BREACH: Org A accessed Org B player by slug!"

        # Org B authorized access succeeds
        res_auth = client.get(f"/api/v1/players/{player_b.slug}", headers={"Authorization": f"Bearer {token_b}"})
        assert res_auth.status_code == 200
        assert res_auth.json()["player"]["id"] == player_b.id
    finally:
        settings.ENVIRONMENT = prev_env
        db.query(Player).filter(Player.id == player_b.id).delete()
        db.query(User).filter(User.id.in_([user_a.id, user_b.id])).delete()
        db.query(Organization).filter(Organization.id.in_([org_a.id, org_b.id])).delete()
        db.commit()
        db.close()


def test_privacy_no_credential_leakage():
    """
    [PRIVACY] Verify that passwords, password hashes, and secrets are never returned in public API payloads.
    """
    db = SessionLocal()
    plain_password = "SuperSecretPassword123!"
    hashed = hash_password(plain_password)
    user = User(
        email=f"privacy_test_{uuid.uuid4().hex[:6]}@scoutai.dev",
        hashed_password=hashed,
        full_name="Privacy Officer",
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)

    try:
        # Check /api/v1/auth/me response
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        body = res.text
        assert plain_password not in body
        assert hashed not in body
        assert "password" not in res.json()
        assert "hashed_password" not in res.json()
    finally:
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()


def test_privacy_token_tampering_rejected():
    """
    [PRIVACY] Verify that tampered tokens or forged signatures are strictly rejected.
    """
    token = create_access_token("user-123", "org-456")
    # Tamper with the user ID claim in the body
    tampered_token = token.replace("user-123", "user-admin")

    prev_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"
    try:
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
        assert res.status_code == 401
    finally:
        settings.ENVIRONMENT = prev_env


# ============================================================================
# 2. SECURITY PILLAR
# ============================================================================

def test_security_path_traversal_prevention():
    """
    [SECURITY] Verify that directory traversal attacks on video streaming are blocked.
    """
    malicious_paths = [
        "../../../../Windows/win.ini",
        "..%2f..%2f..%2fetc%2fpasswd",
        "....//....//....//boot.ini",
        "%2e%2e%2f%2e%2e%2fscoutai_dev.db",
    ]
    for path in malicious_paths:
        res = client.get(f"/api/v1/videos/stream/{path}")
        assert res.status_code == 404


def test_security_hmac_webhook_tamper_detection():
    """
    [SECURITY] Verify that invalid or forged HMAC signatures on Paymob webhooks are rejected with 403.
    """
    fake_body = {
        "type": "TRANSACTION",
        "obj": {
            "id": 12345678,
            "amount_cents": 50000,
            "success": True,
            "currency": "EGP",
            "order": {"id": 99999, "merchant_order_id": "org-fake"},
        },
    }
    # Send with deliberately forged HMAC
    res = client.post("/api/v1/billing/webhook/paymob?hmac=forged_invalid_hmac_hash_value", json=fake_body)
    assert res.status_code == 403
    assert "verification failed" in res.json()["detail"].lower()


def test_security_password_hashing_pbkdf2():
    """
    [SECURITY] Verify password hashing uses PBKDF2 with 600,000 iterations and salt.
    """
    password = "MySecurePassword2026!"
    hashed = hash_password(password)

    assert hashed.startswith("pbkdf2_sha256$600000$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


# ============================================================================
# 3. DATABASE PILLAR
# ============================================================================

def test_database_foreign_key_cascades():
    """
    [DATABASE] Verify that deleting an Organization cascades to delete related Players and Reports.
    """
    db = SessionLocal()
    org = Organization(name="Cascade Club", slug=f"cascade-{uuid.uuid4().hex[:6]}", subscription_tier="STARTER")
    db.add(org)
    db.commit()
    db.refresh(org)

    player = Player(slug=f"casc-player-{uuid.uuid4().hex[:6]}", first_name="A", last_name="B", org_id=org.id)
    video = MatchVideo(title="Match 1", video_url="http://video.mp4", org_id=org.id)
    db.add(player)
    db.add(video)
    db.commit()
    db.refresh(player)
    db.refresh(video)

    report = ScoutingReport(
        slug=f"casc-report-{uuid.uuid4().hex[:6]}",
        org_id=org.id,
        player_id=player.id,
        match_id=video.id,
        sport="football",
        position="Striker",
        overall_score=85,
        overall_grade="A",
        narrative="Test narrative",
    )
    meter = UsageMeter(org_id=org.id, billing_period="2026-10")
    db.add(report)
    db.add(meter)
    db.commit()

    player_id = player.id
    report_id = report.id
    meter_id = meter.id

    # Delete Organization
    db.delete(org)
    db.commit()

    # Verify children were cascaded
    assert db.query(Player).filter(Player.id == player_id).first() is None
    assert db.query(ScoutingReport).filter(ScoutingReport.id == report_id).first() is None
    assert db.query(UsageMeter).filter(UsageMeter.id == meter_id).first() is None
    db.close()


def test_database_atomic_concurrency_stress():
    """
    [DATABASE] Verify that concurrent increments execute atomically without lost updates.
    """
    db = SessionLocal()
    test_org = Organization(name="Stress Test Org", slug=f"stress-{uuid.uuid4().hex[:6]}", subscription_tier="PRO")
    db.add(test_org)
    db.commit()
    db.refresh(test_org)
    org_id = test_org.id
    db.close()

    threads = 8
    increments_each = 5
    total = threads * increments_each

    def _inc():
        thread_db = SessionLocal()
        try:
            for _ in range(increments_each):
                usage_service.increment_usage(thread_db, org_id, "video_uploads", amount=1)
        finally:
            thread_db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as pool:
        list(pool.map(lambda _: _inc(), range(threads)))

    verify_db = SessionLocal()
    meter = usage_service.get_or_create_meter(verify_db, org_id)
    assert meter.video_uploads_count == total

    # Cleanup
    verify_db.query(UsageMeter).filter(UsageMeter.org_id == org_id).delete()
    verify_db.query(Organization).filter(Organization.id == org_id).delete()
    verify_db.commit()
    verify_db.close()


# ============================================================================
# 4. BACKEND PILLAR
# ============================================================================

def test_backend_complete_api_lifecycle():
    """
    [BACKEND] Verify full service lifecycle: Health -> Video Upload -> AI Analysis -> Report -> PDF.
    """
    db = SessionLocal()
    org = Organization(name="Lifecycle Test Club", slug=f"life-{uuid.uuid4().hex[:6]}", subscription_tier="PRO")
    db.add(org)
    db.commit()
    db.refresh(org)
    org_id = org.id
    db.close()

    headers = {"X-Organization-Id": org_id}

    try:
        # 1. Health
        h_res = client.get("/api/v1/health")
        assert h_res.status_code == 200
        assert h_res.json()["status"] == "healthy"

        # 2. Upload URL
        u_res = client.post("/api/v1/videos/upload-url", data={"filename": "training_clip.mp4"}, headers=headers)
        assert u_res.status_code == 200
        assert "uploadUrl" in u_res.json()

        # 3. AI Analysis Generation
        analysis_payload = {
            "sport": "football",
            "position": "Winger",
            "language": "en",
            "playerContext": {
                "id": "P7",
                "label": "#7 Fast Winger",
                "jerseyNumber": "7",
                "position": "Right Winger",
                "teamColorHex": "#3b82f6",
            },
        }
        gen_res = client.post("/api/v1/analysis/generate", json=analysis_payload, headers=headers)
        assert gen_res.status_code == 200
        gen_data = gen_res.json()
        slug = gen_data["shareableSlug"]
        assert slug is not None
        assert gen_data["report"]["overallScore"] >= 0

        # 4. Fetch Persisted Report
        rep_res = client.get(f"/api/v1/analysis/reports/{slug}", headers=headers)
        assert rep_res.status_code == 200
        assert rep_res.json()["slug"] == slug

        # 5. Export Branded PDF
        pdf_res = client.get(f"/api/v1/analysis/reports/{slug}/pdf", headers=headers)
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000

        # 6. Background Job Submission (202 Accepted)
        job_res = client.post("/api/v1/analysis/jobs", json=analysis_payload, headers=headers)
        assert job_res.status_code == 202
        job_data = job_res.json()
        assert job_data["status"] == "queued"
        assert "pollUrl" in job_data
    finally:
        cleanup_db = SessionLocal()
        cleanup_db.query(UsageMeter).filter(UsageMeter.org_id == org_id).delete()
        cleanup_db.query(ScoutingReport).filter(ScoutingReport.org_id == org_id).delete()
        cleanup_db.query(Player).filter(Player.org_id == org_id).delete()
        cleanup_db.query(Organization).filter(Organization.id == org_id).delete()
        cleanup_db.commit()
        cleanup_db.close()


# ============================================================================
# 5. FRONTEND PILLAR
# ============================================================================

def test_frontend_vite_production_build():
    """
    [FRONTEND] Verify that Vite builds the React 19 + TypeScript production app cleanly.
    """
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
        capture_output=True,
        text=True,
        shell=True,
    )
    assert result.returncode == 0, f"Vite build failed:\n{result.stderr}\n{result.stdout}"
    assert "built in" in result.stdout or "dist" in result.stdout

    # Verify output assets exist on disk
    dist_html = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist", "index.html"))
    assert os.path.exists(dist_html), "dist/index.html was not generated by Vite build!"


def test_frontend_typescript_typecheck():
    """
    [FRONTEND] Verify that TypeScript compiler (tsc --noEmit) passes with zero type errors.
    """
    result = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
        capture_output=True,
        text=True,
        shell=True,
    )
    assert result.returncode == 0, f"TypeScript type check failed:\n{result.stdout}\n{result.stderr}"
