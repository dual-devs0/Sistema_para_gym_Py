"""Add partial unique index enforcing one open cash-register shift per gym

CashRegisterService.open() already checks for an existing open shift before
inserting, but that's a plain check-then-insert with a real race window: two
concurrent requests can both pass the check and both insert an open shift.
Unlike the double-checkin race elsewhere in the app, this one can corrupt the
close-time consolidado (Fase 5's central guarantee), so it gets a real DB
constraint instead of relying on the service check alone.

Revision ID: 010
Revises: 009
Create Date: 2026-08-20 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "010"
down_revision: str | None = "009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_cashregistershift_one_open_per_gym",
        "cashregistershift",
        ["gym_id"],
        unique=True,
        postgresql_where=sa.text("status = 'open'"),
    )


def downgrade() -> None:
    op.drop_index("ix_cashregistershift_one_open_per_gym", table_name="cashregistershift")
