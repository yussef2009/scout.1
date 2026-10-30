import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from ..models.database import get_db
from ..models.user import User
from ..models.organization import Organization
from ..dependencies.security import hash_password, verify_password, create_access_token, verify_access_token
from ..config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("scoutai.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
auth_scheme = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    organizationName: Optional[str] = "Elite Sports Academy"
    role: Optional[str] = "scout"


class AuthResponse(BaseModel):
    token: str
    user: dict
    organization: dict


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # In development mode, auto-provision user if requested for instant demo setup
        if settings.ENVIRONMENT == "development":
            try:
                org = Organization(
                    name="ScoutAI Global Academy",
                    slug=f"org-{uuid.uuid4().hex[:6]}",
                    plan_tier="pro",
                    subscription_tier="PRO",
                    subscription_status="ACTIVE",
                )
                db.add(org)
                db.flush()

                user = User(
                    email=req.email,
                    hashed_password=hash_password(req.password),
                    full_name="Elite Scout",
                    role="scout",
                    org_id=org.id,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception as e:
                db.rollback()
                logger.error(f"[Auth Auto-Provision Failed] Rolled back: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error during demo account auto-provisioning.",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Please verify your email and password.",
            )

    # Strictly verify candidate password
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password.",
        )

    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    token = create_access_token(user.id, org.id if org else None)

    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "fullName": user.full_name, "role": user.role},
        organization={
            "id": org.id if org else "org-default",
            "name": org.name if org else "Default Academy",
            "tier": org.subscription_tier if org else "PRO",
        },
    )


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        org = Organization(
            name=req.organizationName or "Scout Club",
            slug=f"org-{uuid.uuid4().hex[:6]}",
            plan_tier="pro",
            subscription_tier="PRO",
            subscription_status="ACTIVE",
        )
        db.add(org)
        db.flush()

        user = User(
            email=req.email,
            hashed_password=hash_password(req.password),
            full_name=req.fullName,
            role=req.role or "scout",
            org_id=org.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        logger.error(f"[Auth Register Failed] Rolled back: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database transaction error during registration.",
        )

    token = create_access_token(user.id, org.id)

    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "fullName": user.full_name, "role": user.role},
        organization={"id": org.id, "name": org.name, "tier": org.subscription_tier},
    )


@router.get("/me")
def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(auth_scheme),
    db: Session = Depends(get_db),
):
    if auth and auth.credentials:
        claims = verify_access_token(auth.credentials)
        if claims and claims.get("user_id"):
            user = db.query(User).filter(User.id == claims["user_id"]).first()
            if user:
                org = db.query(Organization).filter(Organization.id == user.org_id).first()
                return {
                    "id": user.id,
                    "email": user.email,
                    "fullName": user.full_name,
                    "role": user.role,
                    "organization": {
                        "id": org.id if org else None,
                        "name": org.name if org else "Independent Scout",
                        "tier": org.subscription_tier if org else "FREE",
                    },
                }
        # If token was explicitly supplied but failed signature verification
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or tampered authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In production mode, authentication is strictly mandatory
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fallback in local development demo only when NO token was supplied
    default_org = db.query(Organization).first()
    return {
        "id": "u-demo-1",
        "email": "scout@scoutai.dev",
        "fullName": "Senior Technical Director",
        "role": "director",
        "organization": {
            "id": default_org.id if default_org else "org-default",
            "name": default_org.name if default_org else "Olympic Talent Academy",
            "tier": default_org.subscription_tier if default_org else "PRO",
            "license": "FIFA-AGNT-2026",
        },
    }
