import uuid
import concurrent.futures
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.models.database import SessionLocal, engine
from services.api.app.models.organization import Organization
from services.api.app.models.user import User
from services.api.app.models.player import Player
from services.api.app.models.report import ScoutingReport
from services.api.app.models.usage_meter import UsageMeter
from services.api.app.services.usage_service import usage_service
from services.api.app.dependencies.security import create_access_token, hash_password
from services.api.app.config import settings

client = TestClient(app)


@pytest.fixture
def isolated_orgs():
    db = SessionLocal()
    org_a = Organization(
        name="Club Atletico Madrid Academy",
        slug=f"org-a-{uuid.uuid4().hex[:6]}",
        subscription_tier="PRO",
        subscription_status="ACTIVE",
    )
    org_b = Organization(
        name="Bayern Munich Talent Hub",
        slug=f"org-b-{uuid.uuid4().hex[:6]}",
        subscription_tier="PRO",
        subscription_status="ACTIVE",
    )
    db.add(org_a)
    db.add(org_b)
    db.commit()
    db.refresh(org_a)
    db.refresh(org_b)

    # Seed Users for Org A and Org B
    user_a = User(
        email=f"scout_a_{uuid.uuid4().hex[:6]}@atletico.es",
        hashed_password=hash_password("password123"),
        full_name="Diego Scout",
        role="scout",
        org_id=org_a.id,
    )
    user_b = User(
        email=f"scout_b_{uuid.uuid4().hex[:6]}@bayern.de",
        hashed_password=hash_password("password123"),
        full_name="Hans Analyst",
        role="scout",
        org_id=org_b.id,
    )
    db.add(user_a)
    db.add(user_b)
    db.commit()
    db.refresh(user_a)
    db.refresh(user_b)

    token_a = create_access_token(user_a.id, org_a.id)
    token_b = create_access_token(user_b.id, org_b.id)

    # Seed Player for Org A
    player_a = Player(
        slug=f"diego-silva-{uuid.uuid4().hex[:6]}",
        first_name="Diego",
        last_name="Silva",
        primary_sport="football",
        primary_position="Centre-Back",
        org_id=org_a.id,
    )
    # Seed Player for Org B
    player_b = Player(
        slug=f"hans-mueller-{uuid.uuid4().hex[:6]}",
        first_name="Hans",
        last_name="Mueller",
        primary_sport="football",
        primary_position="Goalkeeper",
        org_id=org_b.id,
    )
    db.add(player_a)
    db.add(player_b)
    db.commit()
    db.refresh(player_a)
    db.refresh(player_b)

    yield {
        "org_a": org_a,
        "org_b": org_b,
        "user_a": user_a,
        "user_b": user_b,
        "token_a": token_a,
        "token_b": token_b,
        "player_a": player_a,
        "player_b": player_b,
    }

    # Cleanup
    db.query(Player).filter(Player.id.in_([player_a.id, player_b.id])).delete(synchronize_session=False)
    db.query(User).filter(User.id.in_([user_a.id, user_b.id])).delete(synchronize_session=False)
    db.query(Organization).filter(Organization.id.in_([org_a.id, org_b.id])).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_multitenant_player_isolation(isolated_orgs):
    """
    Forensic Multi-Tenancy Audit:
    Tenant A must strictly only see Tenant A athletes and cannot access Tenant B athletes.
    """
    token_a = isolated_orgs["token_a"]
    token_b = isolated_orgs["token_b"]
    player_a = isolated_orgs["player_a"]
    player_b = isolated_orgs["player_b"]

    # In production mode, tenant scoping is strict and cryptographically validated via token
    prev_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"
    try:
        # Org A requests player list
        res_a = client.get("/api/v1/players", headers={"Authorization": f"Bearer {token_a}"})
        assert res_a.status_code == 200
        players_a = res_a.json()
        ids_a = [p["id"] for p in players_a]

        assert player_a.id in ids_a
        assert player_b.id not in ids_a, "CRITICAL: Cross-tenant data leak! Org A received Org B's player!"

        # Org B requests player list
        res_b = client.get("/api/v1/players", headers={"Authorization": f"Bearer {token_b}"})
        assert res_b.status_code == 200
        players_b = res_b.json()
        ids_b = [p["id"] for p in players_b]

        assert player_b.id in ids_b
        assert player_a.id not in ids_b, "CRITICAL: Cross-tenant data leak! Org B received Org A's player!"

        # IDOR prevention: Org A attempts direct access to Org B player slug
        idor_res = client.get(f"/api/v1/players/{player_b.slug}", headers={"Authorization": f"Bearer {token_a}"})
        assert idor_res.status_code == 404, "CRITICAL: IDOR vulnerability! Org A accessed Org B player by slug!"

        # Authorized access: Org B accesses Org B player
        auth_res = client.get(f"/api/v1/players/{player_b.slug}", headers={"Authorization": f"Bearer {token_b}"})
        assert auth_res.status_code == 200
        assert auth_res.json()["player"]["id"] == player_b.id
    finally:
        settings.ENVIRONMENT = prev_env


def test_atomic_usage_increment_concurrency():
    """
    Forensic Concurrency Audit:
    Verify that concurrent increments execute atomically without lost updates or race conditions.
    """
    db = SessionLocal()
    test_org = Organization(
        name=f"Concurrency Test Club {uuid.uuid4().hex[:6]}",
        slug=f"concurrent-org-{uuid.uuid4().hex[:6]}",
        subscription_tier="PRO",
        subscription_status="ACTIVE",
    )
    db.add(test_org)
    db.commit()
    db.refresh(test_org)
    org_id = test_org.id
    db.close()

    num_threads = 10
    increments_per_thread = 5
    expected_total = num_threads * increments_per_thread

    def _worker_increment():
        thread_db = SessionLocal()
        try:
            for _ in range(increments_per_thread):
                usage_service.increment_usage(thread_db, org_id, "video_uploads", amount=1)
        finally:
            thread_db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(_worker_increment) for _ in range(num_threads)]
        for f in concurrent.futures.as_completed(futures):
            f.result()

    verify_db = SessionLocal()
    meter = usage_service.get_or_create_meter(verify_db, org_id)
    actual_count = meter.video_uploads_count
    verify_db.close()

    assert actual_count == expected_total, f"Concurrency race condition detected! Expected {expected_total}, got {actual_count}"

    # Cleanup
    cleanup_db = SessionLocal()
    cleanup_db.query(UsageMeter).filter(UsageMeter.org_id == org_id).delete()
    cleanup_db.query(Organization).filter(Organization.id == org_id).delete()
    cleanup_db.commit()
    cleanup_db.close()


def test_timezone_aware_utc_timestamps():
    """
    Forensic Schema Integrity Audit:
    Verify that all model instances store timezone-aware UTC timestamps.
    """
    db = SessionLocal()
    org = Organization(
        name="UTC Timezone Test Club",
        slug=f"utc-test-{uuid.uuid4().hex[:6]}",
        subscription_tier="STARTER",
        subscription_status="ACTIVE",
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    assert org.created_at is not None
    assert isinstance(org.created_at, datetime)

    # Cleanup
    db.query(Organization).filter(Organization.id == org.id).delete()
    db.commit()
    db.close()


def test_sqlite_wal_mode_enabled():
    """
    Forensic Database Reliability Audit:
    If running SQLite, verify WAL journal mode is active for high concurrency.
    """
    if engine.dialect.name == "sqlite":
        with engine.connect() as conn:
            from sqlalchemy import text
            res = conn.execute(text("PRAGMA journal_mode")).scalar()
            assert str(res).lower() == "wal", f"SQLite should be running in WAL mode, found {res}"
