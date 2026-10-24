import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from ..models.database import get_db
from ..models.user import User
from ..models.organization import Organization

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


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
        # Auto-provision demo scout user if needed for instant local onboarding
        org = Organization(
            name="ScoutAI Global Academy",
            slug=f"org-{uuid.uuid4().hex[:6]}",
            plan_tier="pro",
        )
        db.add(org)
        db.flush()

        user = User(
            email=req.email,
            hashed_password="mock_hashed_password",
            full_name="Elite Scout",
            role="scout",
            org_id=org.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    org = db.query(Organization).filter(Organization.id == user.org_id).first()

    return AuthResponse(
        token=f"scoutai_token_{user.id}",
        user={"id": user.id, "email": user.email, "fullName": user.full_name, "role": user.role},
        organization={
            "id": org.id if org else "org-default",
            "name": org.name if org else "Default Academy",
            "tier": org.plan_tier if org else "pro",
        },
    )


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    org = Organization(
        name=req.organizationName or "Scout Club",
        slug=f"org-{uuid.uuid4().hex[:6]}",
        plan_tier="pro",
    )
    db.add(org)
    db.flush()

    user = User(
        email=req.email,
        hashed_password="hashed_pw_placeholder",
        full_name=req.fullName,
        role=req.role or "scout",
        org_id=org.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        token=f"scoutai_token_{user.id}",
        user={"id": user.id, "email": user.email, "fullName": user.full_name, "role": user.role},
        organization={"id": org.id, "name": org.name, "tier": org.plan_tier},
    )


@router.get("/me")
def get_current_user():
    return {
        "id": "u-demo-1",
        "email": "scout@scoutai.dev",
        "fullName": "Senior Technical Director",
        "role": "director",
        "organization": {
            "name": "Olympic Talent Academy",
            "tier": "enterprise",
            "license": "FIFA-AGNT-2026",
        },
    }
