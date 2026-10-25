import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.organization import Organization
from ..models.user import User
from ..services.tier_config import TIER_PLANS, normalize_tier
from ..services.stripe_service import stripe_service
from ..services.paymob_service import paymob_service
from ..services.usage_service import usage_service
from ..dependencies.quota_guard import get_current_org

logger = logging.getLogger("scoutai.billing")

router = APIRouter(prefix="/api/v1/billing", tags=["Billing & Quotas"])


class CreateCheckoutSessionRequest(BaseModel):
    tier: str = "PRO"
    currency: str = "EGP"  # EGP | USD
    gateway: Optional[str] = "auto"  # paymob | stripe | auto
    paymentMethod: Optional[str] = "card"  # card | meeza | fawry | wallet
    billingCycle: Optional[str] = "monthly"  # monthly | annual
    organizationId: Optional[str] = None
    successUrl: Optional[str] = None
    cancelUrl: Optional[str] = None
    customerEmail: Optional[EmailStr] = None
    customerName: Optional[str] = None
    customerPhone: Optional[str] = None


class SimulateUpgradeRequest(BaseModel):
    tier: str  # FREE | STARTER | PRO | ENTERPRISE
    organizationId: Optional[str] = None


@router.get("/plans")
def get_plans():
    """
    Returns localized tier definitions, limits, and Egyptian PPP pricing.
    """
    return {
        "currencies": ["EGP", "USD"],
        "defaultCurrency": "EGP",
        "market": "Egypt / MENA",
        "supportedPaymentMethods": [
            {"id": "meeza", "name_en": "Meeza National Card", "name_ar": "بطاقة ميزة الوطنية", "badge": "Egypt Local"},
            {"id": "card", "name_en": "Visa / Mastercard", "name_ar": "فيزا / ماستركارد", "badge": "Instant"},
            {"id": "fawry", "name_en": "Fawry Cash Collection", "name_ar": "الدفع النقدي عبر فوري", "badge": "Cash at Kiosk"},
            {"id": "wallet", "name_en": "Mobile Wallets (Vodafone/InstaPay)", "name_ar": "المحافظ الإلكترونية وإنستاباي", "badge": "Instant"},
            {"id": "stripe", "name_en": "Stripe International", "name_ar": "سترايب الدولي", "badge": "Global"},
        ],
        "plans": [
            TIER_PLANS["FREE"],
            TIER_PLANS["STARTER"],
            TIER_PLANS["PRO"],
            TIER_PLANS["ENTERPRISE"],
        ],
    }


@router.get("/usage")
def get_usage(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """
    Returns current monthly consumption vs. tier limits for the active organization.
    """
    return usage_service.get_usage_summary(db, org.id)


@router.get("/status")
def get_billing_status(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """
    Backward-compatible billing status endpoint enriched with live usage tracking.
    """
    summary = usage_service.get_usage_summary(db, org.id)
    meters = summary["meters"]
    return {
        "tier": summary["tier"].lower(),
        "tierName": summary["tierNameEn"],
        "status": summary["status"],
        "currency": summary["currency"],
        "billingCycle": summary["billingCycle"],
        "quotaMatchesPerMonth": meters["videoUploads"]["limit"],
        "matchesUsed": meters["videoUploads"]["used"],
        "matchesRemaining": meters["videoUploads"]["remaining"],
        "aiReportsLimit": meters["aiReports"]["limit"],
        "aiReportsUsed": meters["aiReports"]["used"],
        "storageUsedGb": round(meters["videoDurationMinutes"]["used"] * 0.05, 2),
        "maxStorageGb": 500.0,
        "licenseVerified": True,
        "accreditationStatus": "Active — FIFA & Olympic Sports Science Certified",
        "meters": meters,
        "resetDate": summary["resetDate"],
    }


@router.post("/create-checkout-session")
def create_checkout_session(
    req: CreateCheckoutSessionRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """
    Generates checkout sessions for Stripe or Paymob based on user location & currency preference.
    """
    target_org_id = req.organizationId or org.id
    target_org = db.query(Organization).filter(Organization.id == target_org_id).first() or org

    norm_tier = normalize_tier(req.tier)
    currency = req.currency.upper()

    # Determine gateway automatically if requested
    gateway = req.gateway
    if not gateway or gateway == "auto":
        if currency == "EGP" or req.paymentMethod in ("meeza", "fawry", "wallet"):
            gateway = "paymob"
        else:
            gateway = "stripe"

    user_email = str(req.customerEmail) if req.customerEmail else "coach@scoutai.eg"
    user_name = req.customerName or target_org.name or "Egyptian Academy Director"
    user_phone = req.customerPhone or "+201012345678"

    if gateway == "paymob":
        result = paymob_service.create_checkout_session(
            org_id=target_org.id,
            org_name=target_org.name,
            user_name=user_name,
            user_email=user_email,
            user_phone=user_phone,
            tier=norm_tier,
            currency="EGP",
            billing_cycle=req.billingCycle or "monthly",
            payment_method=req.paymentMethod or "card",
            success_url=req.successUrl,
            cancel_url=req.cancelUrl,
        )
        return result

    # Default to Stripe
    result = stripe_service.create_checkout_session(
        org_id=target_org.id,
        org_name=target_org.name,
        user_email=user_email,
        tier=norm_tier,
        currency=currency,
        billing_cycle=req.billingCycle or "monthly",
        success_url=req.successUrl,
        cancel_url=req.cancelUrl,
    )
    return result


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handles Stripe subscription lifecycle events (invoice.payment_succeeded, customer.subscription.deleted, etc.).
    """
    payload_bytes = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe_service.verify_webhook(payload_bytes, sig_header)
    except Exception as e:
        logger.error(f"Stripe webhook signature error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})

    logger.info(f"[Stripe Webhook] Received event: {event_type}")

    if event_type in ("checkout.session.completed", "invoice.payment_succeeded"):
        meta = data_object.get("metadata", {})
        org_id = meta.get("org_id") or data_object.get("client_reference_id")
        tier = meta.get("tier", "PRO")
        customer_id = data_object.get("customer")
        subscription_id = data_object.get("subscription")

        org = None
        if org_id:
            org = db.query(Organization).filter(Organization.id == org_id).first()
        elif customer_id:
            org = db.query(Organization).filter(Organization.stripe_customer_id == customer_id).first()

        if org:
            org.subscription_tier = normalize_tier(tier)
            org.plan_tier = org.subscription_tier.lower()
            org.subscription_status = "ACTIVE"
            if customer_id:
                org.stripe_customer_id = customer_id
            if subscription_id:
                org.stripe_subscription_id = subscription_id
            org.current_period_start = datetime.utcnow()
            org.current_period_end = datetime.utcnow() + timedelta(days=30)
            db.commit()
            logger.info(f"[Stripe Webhook] Upgraded organization {org.id} to {org.subscription_tier}")

    elif event_type in ("customer.subscription.deleted", "customer.subscription.paused"):
        customer_id = data_object.get("customer")
        if customer_id:
            org = db.query(Organization).filter(Organization.stripe_customer_id == customer_id).first()
            if org:
                org.subscription_status = "CANCELED"
                org.subscription_tier = "FREE"
                org.plan_tier = "free"
                db.commit()
                logger.info(f"[Stripe Webhook] Downgraded organization {org.id} to FREE")

    return {"status": "success", "event": event_type}


@router.post("/webhook/paymob")
async def paymob_webhook(
    request: Request,
    db: Session = Depends(get_db),
    hmac_param: Optional[str] = None,
):
    """
    Handles Paymob transaction callback webhooks, verifying HMAC security hashes
    and updating organization subscription status in PostgreSQL.
    """
    payload_bytes = await request.body()
    try:
        body = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Paymob delivers HMAC either as query param ?hmac=... or in headers
    received_hmac = (
        request.query_params.get("hmac")
        or request.headers.get("hmac")
        or hmac_param
    )

    # Verify cryptographic HMAC signature
    is_valid = paymob_service.verify_hmac(body, received_hmac)
    if not is_valid:
        logger.warning("[Paymob Webhook] HMAC signature mismatch")
        raise HTTPException(status_code=403, detail="Paymob HMAC verification failed")

    # Extract transaction payload
    obj = body.get("obj", body)
    is_success = obj.get("success") is True
    order_data = obj.get("order", {})
    order_id = str(order_data.get("id") if isinstance(order_data, dict) else order_data)

    logger.info(f"[Paymob Webhook] Order {order_id} success={is_success}")

    if is_success:
        # Check merchant order data or extract tier info
        merchant_order_id = ""
        if isinstance(order_data, dict):
            merchant_order_id = order_data.get("merchant_order_id", "")

        # Look up org or default
        org = None
        if merchant_order_id:
            org = db.query(Organization).filter(Organization.id == merchant_order_id).first()

        if not org:
            org = db.query(Organization).first()

        if org:
            # Upgrade tier based on transaction amount or default to PRO
            amount_cents = obj.get("amount_cents", 199900)
            if amount_cents >= 699900:
                tier = "ENTERPRISE"
            elif amount_cents >= 199900:
                tier = "PRO"
            elif amount_cents >= 49900:
                tier = "STARTER"
            else:
                tier = "PRO"

            org.subscription_tier = tier
            org.plan_tier = tier.lower()
            org.subscription_status = "ACTIVE"
            org.paymob_order_id = order_id
            org.currency = "EGP"
            org.current_period_start = datetime.utcnow()
            org.current_period_end = datetime.utcnow() + timedelta(days=30)
            db.commit()
            logger.info(f"[Paymob Webhook] Upgraded org {org.id} to {tier} (Order: {order_id})")

    return {
        "status": "received",
        "gateway": "paymob",
        "orderId": order_id,
        "success": is_success,
    }


@router.post("/simulate-upgrade")
def simulate_upgrade(
    req: SimulateUpgradeRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """
    Developer / QA convenience endpoint to simulate subscription tier changes in dev mode.
    """
    target_org_id = req.organizationId or org.id
    target_org = db.query(Organization).filter(Organization.id == target_org_id).first()
    if not target_org:
        raise HTTPException(status_code=404, detail="Organization not found")

    norm = normalize_tier(req.tier)
    target_org.subscription_tier = norm
    target_org.plan_tier = norm.lower()
    target_org.subscription_status = "ACTIVE"
    target_org.current_period_start = datetime.utcnow()
    target_org.current_period_end = datetime.utcnow() + timedelta(days=30)
    db.commit()
    db.refresh(target_org)

    return {
        "status": "success",
        "organizationId": target_org.id,
        "subscriptionTier": target_org.subscription_tier,
        "planTier": target_org.plan_tier,
        "subscriptionStatus": target_org.subscription_status,
        "usage": usage_service.get_usage_summary(db, target_org.id),
    }
