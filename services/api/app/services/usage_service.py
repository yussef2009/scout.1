import calendar
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..models.organization import Organization
from ..models.usage_meter import UsageMeter
from .tier_config import get_tier_limits, normalize_tier, TIER_PLANS

logger = logging.getLogger("scoutai.usage_service")


class UsageService:
    @staticmethod
    def current_period() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m")

    @classmethod
    def get_or_create_meter(
        cls, db: Session, org_id: str, period: Optional[str] = None
    ) -> UsageMeter:
        """
        Concurrency-safe meter retrieval. Handles race conditions under simultaneous
        tenant requests attempting to initialize a billing period meter simultaneously.
        """
        period_str = period or cls.current_period()
        meter = (
            db.query(UsageMeter)
            .filter(UsageMeter.org_id == org_id, UsageMeter.billing_period == period_str)
            .first()
        )
        if not meter:
            try:
                meter = UsageMeter(
                    org_id=org_id,
                    billing_period=period_str,
                    video_uploads_count=0,
                    video_duration_minutes=0.0,
                    ai_reports_count=0,
                    players_managed_count=0,
                )
                db.add(meter)
                db.commit()
                db.refresh(meter)
            except IntegrityError:
                db.rollback()
                meter = (
                    db.query(UsageMeter)
                    .filter(UsageMeter.org_id == org_id, UsageMeter.billing_period == period_str)
                    .first()
                )
        return meter

    @classmethod
    def check_quota(
        cls, db: Session, org_id: str, resource: str, amount: float = 1.0
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Validates if organization can consume the requested quota.
        Returns: (allowed: bool, details: dict)
        """
        org = db.query(Organization).filter(Organization.id == org_id).first()
        tier_str = org.subscription_tier if org and org.subscription_tier else (org.plan_tier if org else "FREE")
        norm_tier = normalize_tier(tier_str)
        limits = get_tier_limits(norm_tier)
        meter = cls.get_or_create_meter(db, org_id)

        allowed = True
        limit_val = 0
        current_val = 0

        if resource in ("video_uploads", "upload"):
            limit_val = limits["video_uploads_per_month"]
            current_val = meter.video_uploads_count
            if current_val + int(amount) > limit_val:
                allowed = False

        elif resource in ("video_duration", "duration"):
            limit_val = limits["video_duration_minutes"]
            current_val = meter.video_duration_minutes
            if current_val + amount > limit_val:
                allowed = False

        elif resource in ("ai_reports", "analysis", "report"):
            limit_val = limits["ai_reports_per_month"]
            current_val = meter.ai_reports_count
            if current_val + int(amount) > limit_val:
                allowed = False

        elif resource in ("players", "player_profiles"):
            limit_val = limits["players_managed"]
            current_val = meter.players_managed_count
            if current_val + int(amount) > limit_val:
                allowed = False

        plan_info = TIER_PLANS.get(norm_tier, TIER_PLANS["PRO"])
        return allowed, {
            "resource": resource,
            "allowed": allowed,
            "tier": norm_tier,
            "tierName": plan_info["name_en"],
            "tierNameAr": plan_info["name_ar"],
            "current": current_val,
            "limit": limit_val,
            "remaining": max(0, limit_val - current_val),
            "period": meter.billing_period,
        }

    @classmethod
    def increment_usage(
        cls, db: Session, org_id: str, resource: str, amount: float = 1.0
    ) -> UsageMeter:
        """
        Atomically increments consumed resources using database expressions to prevent lost updates.
        """
        meter = cls.get_or_create_meter(db, org_id)

        update_values = {}
        if resource in ("video_uploads", "upload"):
            update_values[UsageMeter.video_uploads_count] = UsageMeter.video_uploads_count + int(amount)
        elif resource in ("video_duration", "duration"):
            update_values[UsageMeter.video_duration_minutes] = UsageMeter.video_duration_minutes + float(amount)
        elif resource in ("ai_reports", "analysis", "report"):
            update_values[UsageMeter.ai_reports_count] = UsageMeter.ai_reports_count + int(amount)
        elif resource in ("players", "player_profiles"):
            update_values[UsageMeter.players_managed_count] = UsageMeter.players_managed_count + int(amount)

        if update_values:
            try:
                db.query(UsageMeter).filter(UsageMeter.id == meter.id).update(update_values)
                db.commit()
                db.refresh(meter)
            except Exception as e:
                db.rollback()
                logger.error(f"[UsageService] Failed to increment usage atomically: {e}")
                raise

        return meter

    @classmethod
    def check_and_increment_quota_atomic(
        cls, db: Session, org_id: str, resource: str, amount: float = 1.0
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Performs atomic row-level locking (SELECT ... FOR UPDATE) and increment in a single transaction,
        eliminating check-then-act concurrency race conditions.
        """
        org = db.query(Organization).filter(Organization.id == org_id).first()
        tier_str = org.subscription_tier if org and org.subscription_tier else (org.plan_tier if org else "FREE")
        norm_tier = normalize_tier(tier_str)
        limits = get_tier_limits(norm_tier)

        period_str = cls.current_period()
        cls.get_or_create_meter(db, org_id, period_str)

        try:
            # Attempt row-level lock where supported
            query = db.query(UsageMeter).filter(
                UsageMeter.org_id == org_id, UsageMeter.billing_period == period_str
            )
            # Use with_for_update if not SQLite or supported
            try:
                meter = query.with_for_update().first()
            except Exception:
                meter = query.first()

            if not meter:
                meter = cls.get_or_create_meter(db, org_id, period_str)

            allowed = True
            current_val = 0
            limit_val = 0

            if resource in ("video_uploads", "upload"):
                limit_val = limits["video_uploads_per_month"]
                current_val = meter.video_uploads_count
                if current_val + int(amount) > limit_val:
                    allowed = False
                else:
                    meter.video_uploads_count += int(amount)

            elif resource in ("ai_reports", "analysis", "report"):
                limit_val = limits["ai_reports_per_month"]
                current_val = meter.ai_reports_count
                if current_val + int(amount) > limit_val:
                    allowed = False
                else:
                    meter.ai_reports_count += int(amount)

            elif resource in ("video_duration", "duration"):
                limit_val = limits["video_duration_minutes"]
                current_val = meter.video_duration_minutes
                if current_val + amount > limit_val:
                    allowed = False
                else:
                    meter.video_duration_minutes += float(amount)

            elif resource in ("players", "player_profiles"):
                limit_val = limits["players_managed"]
                current_val = meter.players_managed_count
                if current_val + int(amount) > limit_val:
                    allowed = False
                else:
                    meter.players_managed_count += int(amount)

            if allowed:
                db.commit()
                db.refresh(meter)
            else:
                db.rollback()

            plan_info = TIER_PLANS.get(norm_tier, TIER_PLANS["PRO"])
            return allowed, {
                "resource": resource,
                "allowed": allowed,
                "tier": norm_tier,
                "tierName": plan_info["name_en"],
                "tierNameAr": plan_info["name_ar"],
                "current": current_val,
                "limit": limit_val,
                "remaining": max(0, limit_val - current_val),
                "period": meter.billing_period,
            }
        except Exception:
            db.rollback()
            raise

    @classmethod
    def get_usage_summary(cls, db: Session, org_id: str) -> Dict[str, Any]:
        """
        Returns full monthly usage vs tier limits with reset date and localized messages.
        """
        org = db.query(Organization).filter(Organization.id == org_id).first()
        tier_str = org.subscription_tier if org and org.subscription_tier else (org.plan_tier if org else "FREE")
        norm_tier = normalize_tier(tier_str)
        status = org.subscription_status if org and org.subscription_status else "ACTIVE"
        limits = get_tier_limits(norm_tier)
        meter = cls.get_or_create_meter(db, org_id)

        # Calculate period end / reset date (last day of current month in UTC)
        now = datetime.now(timezone.utc)
        last_day = calendar.monthrange(now.year, now.month)[1]
        reset_date = datetime(now.year, now.month, last_day, 23, 59, 59, tzinfo=timezone.utc)

        plan_info = TIER_PLANS.get(norm_tier, TIER_PLANS["PRO"])

        def pct(used: float, max_v: float) -> int:
            if max_v <= 0:
                return 0
            return min(100, int((used / max_v) * 100))

        return {
            "organizationId": org_id,
            "organizationName": org.name if org else "ScoutAI Organization",
            "tier": norm_tier,
            "tierNameEn": plan_info["name_en"],
            "tierNameAr": plan_info["name_ar"],
            "status": status,
            "billingCycle": org.billing_cycle if org else "monthly",
            "currency": org.currency if org else "EGP",
            "billingPeriod": meter.billing_period,
            "resetDate": reset_date.isoformat(),
            "meters": {
                "videoUploads": {
                    "used": meter.video_uploads_count,
                    "limit": limits["video_uploads_per_month"],
                    "remaining": max(0, limits["video_uploads_per_month"] - meter.video_uploads_count),
                    "percentUsed": pct(meter.video_uploads_count, limits["video_uploads_per_month"]),
                    "unit": "matches",
                    "unit_ar": "مباريات",
                },
                "videoDurationMinutes": {
                    "used": round(meter.video_duration_minutes, 1),
                    "limit": limits["video_duration_minutes"],
                    "remaining": max(0.0, round(limits["video_duration_minutes"] - meter.video_duration_minutes, 1)),
                    "percentUsed": pct(meter.video_duration_minutes, limits["video_duration_minutes"]),
                    "unit": "minutes",
                    "unit_ar": "دقائق",
                },
                "aiReports": {
                    "used": meter.ai_reports_count,
                    "limit": limits["ai_reports_per_month"],
                    "remaining": max(0, limits["ai_reports_per_month"] - meter.ai_reports_count),
                    "percentUsed": pct(meter.ai_reports_count, limits["ai_reports_per_month"]),
                    "unit": "reports",
                    "unit_ar": "تقارير",
                },
                "playersManaged": {
                    "used": meter.players_managed_count,
                    "limit": limits["players_managed"],
                    "remaining": max(0, limits["players_managed"] - meter.players_managed_count),
                    "percentUsed": pct(meter.players_managed_count, limits["players_managed"]),
                    "unit": "athletes",
                    "unit_ar": "لاعبين",
                },
            },
            "isQuotaExceeded": (
                meter.video_uploads_count >= limits["video_uploads_per_month"]
                or meter.ai_reports_count >= limits["ai_reports_per_month"]
            ),
        }


usage_service = UsageService()
