import pytest
from services.api.app.models.database import SessionLocal
from services.api.app.models.organization import Organization
from services.api.app.models.usage_meter import UsageMeter
from services.api.app.services.usage_service import usage_service


@pytest.fixture(autouse=True)
def reset_default_org_quota():
    """
    Guarantees test suite isolation by ensuring the default development organization
    maintains an active PRO/ENTERPRISE tier and doesn't starve subsequent test runs.
    """
    db = SessionLocal()
    try:
        org = db.query(Organization).filter(Organization.slug == "scoutai-global").first()
        if not org:
            org = db.query(Organization).first()

        if org:
            org.subscription_tier = "ENTERPRISE"
            org.plan_tier = "enterprise"
            org.subscription_status = "ACTIVE"
            db.commit()

            # Ensure usage meter is reset for clean test execution
            meter = (
                db.query(UsageMeter)
                .filter(UsageMeter.org_id == org.id, UsageMeter.billing_period == usage_service.current_period())
                .first()
            )
            if meter:
                meter.video_uploads_count = 0
                meter.ai_reports_count = 0
                db.commit()
    finally:
        db.close()

    yield

