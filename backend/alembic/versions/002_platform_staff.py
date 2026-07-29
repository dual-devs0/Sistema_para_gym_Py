"""Make gym_id nullable, add is_platform_staff and password_changed_at

Revision ID: 002
Revises: 001
Create Date: 2026-07-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("user", "gym_id", nullable=True, existing_type=postgresql.UUID(as_uuid=True))
    op.add_column("user", sa.Column("is_platform_staff", sa.Boolean, nullable=False, server_default="false"))
    op.add_column("user", sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("user", "last_login", type_=sa.DateTime(timezone=True), postgresql_using="last_login::timestamptz")
    op.create_index("ix_user_gym_id", "user", ["gym_id"])


def downgrade() -> None:
    op.drop_index("ix_user_gym_id", table_name="user")
    op.alter_column("user", "last_login", type_=sa.String(50))
    op.drop_column("user", "password_changed_at")
    op.drop_column("user", "is_platform_staff")
    op.alter_column("user", "gym_id", nullable=False, existing_type=postgresql.UUID(as_uuid=True))
