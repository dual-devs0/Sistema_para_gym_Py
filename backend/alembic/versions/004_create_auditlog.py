"""Create auditlog table

The AuditLog model (app/models/audit_log.py) was never given a migration.
User.audit_logs is a lazy="selectin" relationship, so any ORM query that
loads a User (including login) eagerly selects from auditlog and fails
with UndefinedTableError since the table doesn't exist.

Revision ID: 004
Revises: 003
Create Date: 2026-07-30 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auditlog",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id"), nullable=True, index=True),
        sa.Column("action", sa.String(50), nullable=False, index=True),
        sa.Column("table_name", sa.String(50), nullable=False),
        sa.Column("record_id", sa.String(100), nullable=True, index=True),
        sa.Column("changes", sa.Text, nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("auditlog")
