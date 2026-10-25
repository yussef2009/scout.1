from typing import Optional, Tuple
from fastapi import Header, Query, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.organization import Organization
from ..models.user import User
from ..services.usage_service import usage_service
from ..dependencies.security import verify_access_token
from ..config import settings

auth_scheme = HTTPBearer(auto_error=False)


def get_current_user_and_org(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(auth_scheme),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id"),
    org_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> Tuple[Optional[User], Organization]:
    """
    Cryptographically authenticates session token and guarantees tenant organization isolation.
    In development mode, gracefully falls back to default organization context for test suites and demo scripts.
    """
    token_str = None
    if auth and auth.credentials:
        token_str = auth.credentials
    else:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token_str = auth_header[7:].strip()

    if token_str:
        claims = verify_access_token(token_str)
        if claims and claims.get("user_id"):
            user = db.query(User).filter(User.id == claims["user_id"]).first()
            if user:
                target_org_id = user.org_id or claims.get("org_id")
                org = db.query(Organization).filter(Organization.id == target_org_id).first() if target_org_id else None
                if org:
                    return user, org

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or tampered authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In development mode, allow seamless onboarding / test execution
    if settings.ENVIRONMENT == "development":
        target_id = x_organization_id or x_org_id or org_id
        org = None
        if target_id:
            org = db.query(Organization).filter(Organization.id == target_id).first()

        if not org:
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

        demo_user = db.query(User).filter(User.org_id == org.id).first()
        return demo_user, org

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_org(
    user_and_org: Tuple[Optional[User], Organization] = Depends(get_current_user_and_org),
) -> Organization:
    return user_and_org[1]


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
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "QUOTA_EXCEEDED",
                "resource": "video_uploads",
                "current": current,
                "limit": limit,
                "tier": tier,
                "message_en": f"Monthly match video upload quota reached ({current}/{limit}). Please upgrade for 60 uploads/month.",
                "message_ar": f"تم استنفاد الحد الشهري لرفع فيديوهات المباريات ({current}/{limit}). يرجى ترقية الباقة لزيادة عدد الفيديوهات.",
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "QUOTA_EXCEEDED",
                "resource": "ai_reports",
                "current": current,
                "limit": limit,
                "tier": tier,
                "message_en": f"Monthly AI tactical scouting report quota reached ({current}/{limit}). Upgrade to Pro Academy for 60 reports/month.",
                "message_ar": f"تم بلوغ الحد الشهري لتقارير الاستكشاف التكتيكي بالذكاء الاصطناعي ({current}/{limit}). يرجى ترقية الباقة للحصول على تقارير إضافية.",
                "upgrade_url": "/billing",
            },
        )
    return org
