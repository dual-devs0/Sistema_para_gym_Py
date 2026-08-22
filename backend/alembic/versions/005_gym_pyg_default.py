"""Default new gyms to PYG / America/Asuncion

Target market is Paraguay, not Mexico. Only changes the column default for
new rows; existing gyms keep whatever currency/timezone they already have.

Revision ID: 005
Revises: 004
Create Date: 2026-08-17 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("gym", "currency", server_default="PYG")
    op.alter_column("gym", "timezone", server_default="America/Asuncion")


def downgrade() -> None:
    op.alter_column("gym", "currency", server_default="MXN")
    op.alter_column("gym", "timezone", server_default="America/Mexico_City")
