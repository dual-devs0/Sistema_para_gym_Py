"""Create fiscal config, timbrado and SIFEN document tables

Fase 3 (Sub-entrega 3a): white-label electronic invoicing scaffolding for
SIFEN/DNIT Paraguay. No certificate table yet — that's Sub-entrega 3b,
blocked until a real PSC certificate is available to inspect. Every gym is
fiscally "not ready" until then, so payments keep working exactly as
before and SIFEN documents just sit in pending_stamping.

Revision ID: 007
Revises: 006
Create Date: 2026-08-20 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "007"
down_revision: str | None = "006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "gymfiscalconfig",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, unique=True, index=True),
        sa.Column("ruc", sa.String(20), nullable=True),
        sa.Column("razon_social", sa.String(200), nullable=True),
        sa.Column("sifen_environment", sa.String(20), nullable=False, server_default="test"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "timbrado",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column("establecimiento", sa.String(3), nullable=False),
        sa.Column("punto_expedicion", sa.String(3), nullable=False),
        sa.Column("numero_desde", sa.Integer, nullable=False),
        sa.Column("numero_hasta", sa.Integer, nullable=False),
        sa.Column("numero_actual", sa.Integer, nullable=False),
        sa.Column("fecha_vencimiento", sa.Date, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "sifendocument",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payment.id"), nullable=False, unique=True, index=True),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column("cdc", sa.String(44), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending_stamping"),
        sa.Column("environment", sa.String(20), nullable=False, server_default="test"),
        sa.Column("xml_unsigned", sa.Text, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("protocol_number", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("sifendocument")
    op.drop_table("timbrado")
    op.drop_table("gymfiscalconfig")
