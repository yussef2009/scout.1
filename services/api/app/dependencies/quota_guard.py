from typing import Optional
from fastapi import Header, Query, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.organization import Organization
from ..services.usage_service import usage_service


def get_current_org(
    request: Request,
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id"),
    org_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> Organization:
    """
    Resolves the organization context from headers, query params, or default organization.
    """
    target_id = x_organization_id or x_org_id or org_id

    org = None
    if target_id:
        org = db.query(Organization).filter(Organization.id == target_id).first()

    if not org:
        # Resolve or auto-seed default organization for demo/test environments
        org = db.query(Organization).first()
        if not org:
            org = Organization(
                name="ScoutAI Global Academy",
                slug="scoutai-global",
                plan_tier="pro",
                subscription_tier="PRO",
                subscription_status="ACTIVE",
            )
            db.add(org)
            db.commit()
            db.refresh(org)

    return org


def require_video_upload_quota(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> Organization:
    """
    Enforces monthly match video upload limits before processing upload requests.
    Returns 403 Forbidden with localized EN/AR instructions if limit exceeded.
    """
    allowed, details = usage_service.check_quota(db, org.id, "video_uploads", amount=1)
    if not allowed:
        current = details["current"]
        limit = details["limit"]
        tier = details["tier"]
        raise HTTPException(
            status_code=403,
            detail={
                "code": "QUOTA_EXCEEDED",
                "resource": "video_uploads",
                "current": current,
                "limit": limit,
                "tier": tier,
                "message_en": f"Monthly match video upload quota reached ({current}/{limit}). Please upgrade to Pro Academy for 60 uploads/month.",
                "message_ar": f"تم استنفاد الحد الشهري لرفع فيديوهات المباريات ({current}/{limit}). يرجى الترقية إلى باقة الأكاديميات المحترفة للحصول على 60 مباراة شهرياً.",
                "upgrade_url": "/billing",
            },
        )
    return org


def require_ai_analysis_quota(
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> Organization:
    """
    Enforces monthly AI scouting reports quota before launching deep Gemini synthesis.
    Returns 403 Forbidden with localized EN/AR instructions if limit exceeded.
    """
    allowed, details = usage_service.check_quota(db, org.id, "ai_reports", amount=1)
    if not allowed:
        current = details["current"]
        limit = details["limit"]
        tier = details["tier"]
        raise HTTPException(
            status_code=403,
            detail={
                "code": "QUOTA_EXCEEDED",
                "resource": "ai_reports",
                "current": current,
                "limit": limit,
                "tier": tier,
                "message_en": f"Monthly AI tactical scouting report quota reached ({current}/{limit}). Upgrade to Pro Academy for 60 reports/month.",
                "message_ar": f"تم بلوغ الحد الشهري لتقارير الاستكشاف التكتيكي بالذكاء الاصطناعي ({current}/{limit}). يرجى الترقية لباقة الأكاديميات المحترفة للحصول على 60 تقريراً شهرياً.",
                "upgrade_url": "/billing",
            },
        )
    return org
