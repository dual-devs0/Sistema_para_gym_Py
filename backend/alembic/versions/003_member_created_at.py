"""Rename member.registered_at to member.created_at

The member model uses TimestampMixin (created_at/updated_at), same as
every other table (gym, user, membershipplan, membermembership, payment,
attendance). 001_initial_schema.py named this column registered_at on
member only, out of sync with the model — any ORM query against Member
fails with UndefinedColumnError since SQLAlchemy selects member.created_at.

Revision ID: 003
Revises: 002
Create Date: 2026-07-30 14:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("member", "registered_at", new_column_name="created_at")


def downgrade() -> None:
    op.alter_column("member", "created_at", new_column_name="registered_at")
