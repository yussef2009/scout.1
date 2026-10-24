from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/billing", tags=["Billing & Quotas"])


@router.get("/status")
def get_billing_status():
    return {
        "tier": "enterprise",
        "quotaMatchesPerMonth": 1000,
        "matchesUsed": 124,
        "storageUsedGb": 14.8,
        "maxStorageGb": 500.0,
        "licenseVerified": True,
        "accreditationStatus": "Active — FIFA & Olympic Sports Science Certified",
    }


@router.post("/webhook")
def billing_webhook(payload: dict):
    return {"status": "received", "event": payload.get("type", "unknown")}
