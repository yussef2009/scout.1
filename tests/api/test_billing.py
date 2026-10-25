import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from services.api.app.main import app
from services.api.app.models.database import SessionLocal
from services.api.app.models.organization import Organization
from services.api.app.models.usage_meter import UsageMeter
from services.api.app.services.paymob_service import paymob_service
from services.api.app.services.usage_service import usage_service

client = TestClient(app)


class OrgStub:
    def __init__(self, org_id: str, name: str):
        self.id = org_id
        self.name = name


@pytest.fixture
def test_org():
    db = SessionLocal()
    org = db.query(Organization).filter(Organization.slug == "test-billing-org").first()
    if not org:
        org = Organization(
            name="Al-Ahly Youth Academy",
            slug="test-billing-org",
            plan_tier="free",
            subscription_tier="FREE",
            subscription_status="ACTIVE",
            currency="EGP",
        )
        db.add(org)
        db.commit()
        db.refresh(org)
    else:
        org.subscription_tier = "FREE"
        org.plan_tier = "free"
        org.subscription_status = "ACTIVE"
        db.commit()
        db.refresh(org)

    org_id = org.id
    org_name = org.name

    # Clean existing meters for this org
    db.query(UsageMeter).filter(UsageMeter.org_id == org_id).delete()
    db.commit()
    db.close()

    return OrgStub(org_id, org_name)


def test_get_billing_plans():
    """Verify localized plan offerings and Egyptian PPP tiers."""
    res = client.get("/api/v1/billing/plans")
    assert res.status_code == 200
    data = res.json()

    assert "plans" in data
    assert "supportedPaymentMethods" in data
    assert data["defaultCurrency"] == "EGP"

    plan_ids = [p["id"] for p in data["plans"]]
    assert "FREE" in plan_ids
    assert "STARTER" in plan_ids
    assert "PRO" in plan_ids
    assert "ENTERPRISE" in plan_ids

    # Check Egyptian pricing & localized labels
    starter = next(p for p in data["plans"] if p["id"] == "STARTER")
    assert starter["pricing"]["EGP"]["monthly"] == 499
    assert "المستقل" in starter["name_ar"]

    pro = next(p for p in data["plans"] if p["id"] == "PRO")
    assert pro["pricing"]["EGP"]["monthly"] == 1999
    assert pro["popular"] is True


def test_create_checkout_session_paymob_fawry(test_org):
    """Test generating Paymob session with Fawry 10-digit cash reference code."""
    payload = {
        "tier": "STARTER",
        "currency": "EGP",
        "gateway": "paymob",
        "paymentMethod": "fawry",
        "billingCycle": "monthly",
        "organizationId": test_org.id,
        "customerEmail": "director@ahly-academy.eg",
        "customerName": "Captain Mahmoud",
        "customerPhone": "+201012345678",
    }
    res = client.post("/api/v1/billing/create-checkout-session", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["gateway"] == "paymob"
    assert data["paymentMethod"] == "fawry"
    assert data["amountEgp"] == 499
    assert "fawryRefCode" in data
    assert len(data["fawryRefCode"]) == 10
    assert "fawryExpiresAt" in data
    assert "فوري" in data["instructions_ar"]


def test_create_checkout_session_stripe(test_org):
    """Test generating Stripe international checkout session."""
    payload = {
        "tier": "PRO",
        "currency": "USD",
        "gateway": "stripe",
        "billingCycle": "annual",
        "organizationId": test_org.id,
        "customerEmail": "global-scout@zamalek.com",
    }
    res = client.post("/api/v1/billing/create-checkout-session", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["gateway"] == "stripe"
    assert data["currency"] == "USD"
    assert data["amount"] == 490
    assert "checkoutUrl" in data
    assert "sessionId" in data


def test_paymob_webhook_with_hmac(test_org):
    """Test Paymob transaction webhook callback verifying HMAC SHA512 security hash."""
    transaction_obj = {
        "id": 99887766,
        "amount_cents": 199900,
        "success": True,
        "currency": "EGP",
        "created_at": "2026-10-24T18:00:00.000Z",
        "error_occured": False,
        "has_parent_transaction": False,
        "integration_id": 456789,
        "is_3d_secure": True,
        "is_auth": False,
        "is_capture": False,
        "is_refunded": False,
        "is_standalone_payment": True,
        "is_voided": False,
        "owner": 12345,
        "pending": False,
        "order": {
            "id": 8881234,
            "merchant_order_id": test_org.id,
        },
        "source_data": {
            "pan": "2345",
            "sub_type": "Meeza",
            "type": "card",
        },
    }

    # Calculate valid HMAC SHA512
    valid_hmac = paymob_service.calculate_test_hmac(transaction_obj)

    webhook_payload = {
        "type": "TRANSACTION",
        "obj": transaction_obj,
    }

    res = client.post(
        f"/api/v1/billing/webhook/paymob?hmac={valid_hmac}",
        json=webhook_payload,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success" or data["status"] == "received"
    assert data["success"] is True

    # Check that database organization was upgraded to PRO
    db = SessionLocal()
    updated_org = db.query(Organization).filter(Organization.id == test_org.id).first()
    assert updated_org.subscription_tier == "PRO"
    assert updated_org.subscription_status == "ACTIVE"
    db.close()


def test_stripe_webhook_lifecycle(test_org):
    """Test Stripe subscription webhook lifecycle events."""
    webhook_payload = {
        "id": "evt_test_123456",
        "type": "invoice.payment_succeeded",
        "data": {
            "object": {
                "customer": "cus_test_egypt_99",
                "subscription": "sub_test_egypt_99",
                "metadata": {
                    "org_id": test_org.id,
                    "tier": "ENTERPRISE",
                },
            }
        },
    }

    res = client.post("/api/v1/billing/webhook/stripe", json=webhook_payload)
    assert res.status_code == 200

    # Verify upgrade to ENTERPRISE
    db = SessionLocal()
    updated_org = db.query(Organization).filter(Organization.id == test_org.id).first()
    assert updated_org.subscription_tier == "ENTERPRISE"
    assert updated_org.subscription_status == "ACTIVE"
    db.close()

    # Simulate cancellation event
    cancel_payload = {
        "id": "evt_test_cancel_123",
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "customer": "cus_test_egypt_99",
            }
        },
    }
    cancel_res = client.post("/api/v1/billing/webhook/stripe", json=cancel_payload)
    assert cancel_res.status_code == 200

    db = SessionLocal()
    canceled_org = db.query(Organization).filter(Organization.id == test_org.id).first()
    assert canceled_org.subscription_status == "CANCELED"
    assert canceled_org.subscription_tier == "FREE"
    db.close()


def test_usage_meter_and_quota_enforcement(test_org):
    """
    Test quota enforcement middleware:
    1. Check initial usage.
    2. Set org tier to FREE (quota: 3 match uploads).
    3. Consume 3 uploads.
    4. 4th upload must be rejected with 403 Forbidden and localized error.
    5. Upgrade to PRO and verify upload is immediately unblocked.
    """
    db = SessionLocal()
    org = db.query(Organization).filter(Organization.id == test_org.id).first()
    org.subscription_tier = "FREE"
    org.plan_tier = "free"
    db.commit()

    # Reset usage meter to 0
    meter = usage_service.get_or_create_meter(db, org.id)
    meter.video_uploads_count = 0
    meter.ai_reports_count = 0
    db.commit()
    db.close()

    # 1. Check usage endpoint
    headers = {"X-Organization-Id": test_org.id}
    usage_res = client.get("/api/v1/billing/usage", headers=headers)
    assert usage_res.status_code == 200
    usage_data = usage_res.json()
    assert usage_data["tier"] == "FREE"
    assert usage_data["meters"]["videoUploads"]["limit"] == 3
    assert usage_data["meters"]["videoUploads"]["used"] == 0

    # 2. Consume 3 video uploads (permitted under Free tier)
    for i in range(3):
        res = client.post(
            "/api/v1/videos/upload-url",
            data={"filename": f"match_clip_{i}.mp4"},
            headers=headers,
        )
        assert res.status_code == 200
        # Simulating upload completion by incrementing
        db = SessionLocal()
        usage_service.increment_usage(db, test_org.id, "video_uploads", amount=1)
        db.close()

    # 3. 4th upload attempt must fail with 403 Forbidden & localized message
    blocked_res = client.post(
        "/api/v1/videos/upload-url",
        data={"filename": "match_clip_exceeded.mp4"},
        headers=headers,
    )
    assert blocked_res.status_code == 403
    err = blocked_res.json()["detail"]
    assert err["code"] == "QUOTA_EXCEEDED"
    assert err["resource"] == "video_uploads"
    assert "3/3" in err["message_en"]
    assert "استنفاد" in err["message_ar"]
    assert err["upgrade_url"] == "/billing"

    # 4. Simulate upgrade to PRO tier
    sim_res = client.post(
        "/api/v1/billing/simulate-upgrade",
        json={"tier": "PRO", "organizationId": test_org.id},
    )
    assert sim_res.status_code == 200
    assert sim_res.json()["subscriptionTier"] == "PRO"

    # 5. Verify upload is now immediately permitted
    unblocked_res = client.post(
        "/api/v1/videos/upload-url",
        data={"filename": "match_clip_unblocked.mp4"},
        headers=headers,
    )
    assert unblocked_res.status_code == 200
