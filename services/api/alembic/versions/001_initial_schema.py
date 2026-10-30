"""initial production schema with indexes, cascades, and UTC timestamps

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-10-30 10:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. organizations
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("license_code", sa.String(length=50), nullable=True),
        sa.Column("plan_tier", sa.String(length=50), nullable=True),
        sa.Column("subscription_tier", sa.String(length=50), nullable=False, server_default="PRO"),
        sa.Column("subscription_status", sa.String(length=50), nullable=False, server_default="ACTIVE"),
        sa.Column("billing_cycle", sa.String(length=20), nullable=False, server_default="monthly"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="EGP"),
        sa.Column("stripe_customer_id", sa.String(length=100), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(length=100), nullable=True),
        sa.Column("paymob_customer_id", sa.String(length=100), nullable=True),
        sa.Column("paymob_order_id", sa.String(length=100), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_organizations_slug"), "organizations", ["slug"], unique=True)
    op.create_index(op.f("ix_organizations_stripe_customer_id"), "organizations", ["stripe_customer_id"], unique=False)
    op.create_index(op.f("ix_organizations_paymob_customer_id"), "organizations", ["paymob_customer_id"], unique=False)
    op.create_index(op.f("ix_organizations_created_at"), "organizations", ["created_at"], unique=False)

    # 2. users
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=True, server_default="scout"),
        sa.Column("org_id", sa.String(length=36), nullable=True),
        sa.Column("subscription_tier", sa.String(length=50), nullable=False, server_default="PRO"),
        sa.Column("subscription_status", sa.String(length=50), nullable=False, server_default="ACTIVE"),
        sa.Column("stripe_customer_id", sa.String(length=100), nullable=True),
        sa.Column("paymob_customer_id", sa.String(length=100), nullable=True),
        sa.Column("billing_cycle", sa.String(length=20), nullable=False, server_default="monthly"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="EGP"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_org_id"), "users", ["org_id"], unique=False)
    op.create_index(op.f("ix_users_created_at"), "users", ["created_at"], unique=False)

    # 3. players
    op.create_table(
        "players",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("primary_sport", sa.String(length=50), nullable=False, server_default="football"),
        sa.Column("primary_position", sa.String(length=50), nullable=True),
        sa.Column("jersey_number", sa.String(length=10), nullable=True),
        sa.Column("team_name", sa.String(length=100), nullable=True),
        sa.Column("team_color", sa.String(length=50), nullable=True, server_default="#6366f1"),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("nationality", sa.String(length=100), nullable=True),
        sa.Column("date_of_birth", sa.String(length=50), nullable=True),
        sa.Column("org_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_players_slug"), "players", ["slug"], unique=True)
    op.create_index(op.f("ix_players_org_id"), "players", ["org_id"], unique=False)
    op.create_index(op.f("ix_players_primary_sport"), "players", ["primary_sport"], unique=False)
    op.create_index(op.f("ix_players_created_at"), "players", ["created_at"], unique=False)

    # 4. match_videos
    op.create_table(
        "match_videos",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("video_url", sa.String(length=1000), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True, server_default="0.0"),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("sport", sa.String(length=50), nullable=False, server_default="football"),
        sa.Column("status", sa.String(length=50), nullable=True, server_default="processed"),
        sa.Column("org_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_match_videos_org_id"), "match_videos", ["org_id"], unique=False)
    op.create_index(op.f("ix_match_videos_sport"), "match_videos", ["sport"], unique=False)
    op.create_index(op.f("ix_match_videos_status"), "match_videos", ["status"], unique=False)
    op.create_index(op.f("ix_match_videos_created_at"), "match_videos", ["created_at"], unique=False)

    # 5. scouting_reports
    op.create_table(
        "scouting_reports",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("org_id", sa.String(length=36), nullable=True),
        sa.Column("match_id", sa.String(length=36), nullable=True),
        sa.Column("player_id", sa.String(length=36), nullable=True),
        sa.Column("sport", sa.String(length=50), nullable=False, server_default="football"),
        sa.Column("position", sa.String(length=50), nullable=False),
        sa.Column("position_code", sa.String(length=20), nullable=True),
        sa.Column("overall_score", sa.Integer(), nullable=False),
        sa.Column("overall_grade", sa.String(length=10), nullable=False),
        sa.Column("potential_rating", sa.Integer(), nullable=True, server_default="85"),
        sa.Column("player_summary", sa.String(length=255), nullable=True),
        sa.Column("one_liner", sa.String(length=500), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("metrics", sa.JSON(), nullable=True),
        sa.Column("radar_metrics", sa.JSON(), nullable=True),
        sa.Column("position_profile", sa.JSON(), nullable=True),
        sa.Column("playing_time", sa.JSON(), nullable=True),
        sa.Column("strengths", sa.JSON(), nullable=True),
        sa.Column("weaknesses", sa.JSON(), nullable=True),
        sa.Column("recommended_drills", sa.JSON(), nullable=True),
        sa.Column("narrative", sa.Text(), nullable=False),
        sa.Column("pro_comparisons", sa.JSON(), nullable=True),
        sa.Column("kinematics", sa.JSON(), nullable=True),
        sa.Column("telemetry", sa.JSON(), nullable=True),
        sa.Column("language", sa.String(length=10), nullable=True, server_default="en"),
        sa.Column("verified", sa.Boolean(), nullable=True, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["match_id"], ["match_videos.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_scouting_reports_slug"), "scouting_reports", ["slug"], unique=True)
    op.create_index(op.f("ix_scouting_reports_org_id"), "scouting_reports", ["org_id"], unique=False)
    op.create_index(op.f("ix_scouting_reports_match_id"), "scouting_reports", ["match_id"], unique=False)
    op.create_index(op.f("ix_scouting_reports_player_id"), "scouting_reports", ["player_id"], unique=False)
    op.create_index(op.f("ix_scouting_reports_sport"), "scouting_reports", ["sport"], unique=False)
    op.create_index(op.f("ix_scouting_reports_created_at"), "scouting_reports", ["created_at"], unique=False)

    # 6. usage_meters
    op.create_table(
        "usage_meters",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("org_id", sa.String(length=36), nullable=False),
        sa.Column("billing_period", sa.String(length=7), nullable=False),
        sa.Column("video_uploads_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("video_duration_minutes", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("ai_reports_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("players_managed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("org_id", "billing_period", name="uq_org_billing_period"),
    )
    op.create_index(op.f("ix_usage_meters_org_id"), "usage_meters", ["org_id"], unique=False)
    op.create_index(op.f("ix_usage_meters_billing_period"), "usage_meters", ["billing_period"], unique=False)
    op.create_index(op.f("ix_usage_meters_created_at"), "usage_meters", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_table("usage_meters")
    op.drop_table("scouting_reports")
    op.drop_table("match_videos")
    op.drop_table("players")
    op.drop_table("users")
    op.drop_table("organizations")

