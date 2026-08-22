"""Add notifications_enabled to gym and create notificationlog table

Fase 2: WhatsApp notifications (360dialog). Per-gym opt-in toggle plus a log
table used both to show notification history on a member and to keep the
daily expiry-reminder cron from sending the same reminder twice for the
same membership.

Revision ID: 006
Revises: 005
Create Date: 2026-08-17 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "gym",
        sa.Column("notifications_enabled", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "notificationlog",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column("member_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("member.id"), nullable=False, index=True),
        sa.Column(
            "member_membership_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("membermembership.id"),
            nullable=True,
            index=True,
        ),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("provider_message_id", sa.String(100), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Idempotency for the expiry-reminder cron only: at most one reminder per
    # membership. payment_confirmation also carries member_membership_id but
    # a member can pay against the same membership more than once (partial/
    # installment payments), so that type is deliberately excluded here.
    op.create_index(
        "ix_notificationlog_membership_expiry_unique",
        "notificationlog",
        ["member_membership_id", "type"],
        unique=True,
        postgresql_where=sa.text("type = 'expiry_reminder'"),
    )


def downgrade() -> None:
    op.drop_table("notificationlog")
    op.drop_column("gym", "notifications_enabled")
