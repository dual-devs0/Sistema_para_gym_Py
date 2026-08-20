"""Add member balance tracking and gym debt limit

Fase 4: cuentas corrientes / saldo deudor. member.balance is a cached sum
of memberbalancemovement.amount (source of truth is the movement table,
not the column). gym.debt_limit defaults to NULL — same opt-in rollout
pattern as notifications_enabled/SIFEN: existing gyms see no behavior
change until an owner explicitly sets a limit.

Revision ID: 008
Revises: 007
Create Date: 2026-08-20 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "008"
down_revision: str | None = "007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("member", sa.Column("balance", sa.Numeric(10, 2), nullable=False, server_default="0"))
    op.add_column("gym", sa.Column("debt_limit", sa.Numeric(10, 2), nullable=True))

    op.create_table(
        "memberbalancemovement",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column("member_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("member.id"), nullable=False, index=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("motivo", sa.Text, nullable=False),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("memberbalancemovement")
    op.drop_column("gym", "debt_limit")
    op.drop_column("member", "balance")
