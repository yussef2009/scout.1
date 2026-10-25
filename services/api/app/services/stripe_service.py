import logging
import uuid
import time
from typing import Dict, Any, Optional
from ..config import settings
from .tier_config import TIER_PLANS, normalize_tier

logger = logging.getLogger("scoutai.stripe")


class StripeService:
    def __init__(self):
        self.secret_key = settings.STRIPE_SECRET_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        self._is_mock = self.secret_key.startswith("sk_test_scoutai_mock") or not self.secret_key

    def create_checkout_session(
        self,
        org_id: str,
        org_name: str,
        user_email: str,
        tier: str,
        currency: str = "USD",
        billing_cycle: str = "monthly",
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates a Stripe Checkout Session for international credit card payments.
        """
        norm_tier = normalize_tier(tier)
        plan_info = TIER_PLANS.get(norm_tier, TIER_PLANS["PRO"])
        pricing = plan_info["pricing"].get(currency.upper(), plan_info["pricing"]["USD"])
        amount = pricing["annual"] if billing_cycle == "annual" else pricing["monthly"]

        base_web_url = settings.FRONTEND_URL
        s_url = success_url or f"{base_web_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}&gateway=stripe&tier={norm_tier}"
        c_url = cancel_url or f"{base_web_url}/billing/cancel?gateway=stripe"

        # Generate realistic session structure
        session_id = f"cs_test_{uuid.uuid4().hex}"
        customer_id = f"cus_{uuid.uuid4().hex[:14]}"
        sub_id = f"sub_{uuid.uuid4().hex[:14]}"

        # If real stripe is configured with live/test key (not placeholder), execute stripe API call
        if not self._is_mock:
            try:
                import stripe
                stripe.api_key = self.secret_key
                unit_amount_cents = int(amount * 100)
                session = stripe.checkout.Session.create(
                    payment_method_types=["card"],
                    customer_email=user_email,
                    line_items=[{
                        "price_data": {
                            "currency": currency.lower(),
                            "product_data": {
                                "name": f"ScoutAI 2.0 — {plan_info['name_en']}",
                                "description": f"Athletic Intelligence & Scouting ({billing_cycle.capitalize()})",
                            },
                            "unit_amount": unit_amount_cents,
                            "recurring": {
                                "interval": "year" if billing_cycle == "annual" else "month",
                            },
                        },
                        "quantity": 1,
                    }],
                    mode="subscription",
                    success_url=s_url,
                    cancel_url=c_url,
                    client_reference_id=org_id,
                    metadata={
                        "org_id": org_id,
                        "tier": norm_tier,
                        "billing_cycle": billing_cycle,
                        "currency": currency.upper(),
                    },
                )
                return {
                    "sessionId": session.id,
                    "checkoutUrl": session.url,
                    "customerId": session.customer,
                    "gateway": "stripe",
                    "currency": currency.upper(),
                    "amount": amount,
                    "tier": norm_tier,
                    "billingCycle": billing_cycle,
                }
            except Exception as e:
                logger.warning(f"[Stripe API Warning] Failed to reach live Stripe API: {e}. Falling back to simulation.")

        # Resilient fallback / development checkout URL
        resolved_success_url = s_url.replace("{CHECKOUT_SESSION_ID}", session_id)
        return {
            "sessionId": session_id,
            "checkoutUrl": resolved_success_url,
            "customerId": customer_id,
            "subscriptionId": sub_id,
            "gateway": "stripe",
            "currency": currency.upper(),
            "amount": amount,
            "tier": norm_tier,
            "billingCycle": billing_cycle,
            "simulated": True,
        }

    def verify_webhook(self, payload_bytes: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Constructs and validates incoming Stripe webhook event.
        """
        if not self._is_mock and sig_header:
            try:
                import stripe
                event = stripe.Webhook.construct_event(
                    payload_bytes, sig_header, self.webhook_secret
                )
                return event
            except Exception as e:
                logger.error(f"Stripe webhook signature verification failed: {e}")
                raise ValueError(f"Invalid Stripe signature: {e}")

        # Local mock verification
        import json
        try:
            return json.loads(payload_bytes.decode("utf-8"))
        except Exception:
            return {"type": "unknown", "data": {}}


stripe_service = StripeService()
