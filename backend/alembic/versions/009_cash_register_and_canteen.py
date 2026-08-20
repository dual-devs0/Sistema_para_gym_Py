"""Add cash register shifts and canteen/stock products

Fase 5: caja chica (apertura/cierre de turno con consolidado automático,
calculado contra los pagos reales del turno, nunca cargado a mano) y
cantina/stock (productos simples con descuento de stock atómico al vender).
A PaymentItem row ties a cantina sale to the existing Payment it was sold
within, so the cash-register consolidado (which already groups by
Payment.payment_method) picks up cantina revenue automatically.

Revision ID: 009
Revises: 008
Create Date: 2026-08-20 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "009"
down_revision: str | None = "008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cashregistershift",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column("opened_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("opening_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(10), nullable=False, server_default="open"),
        sa.Column("closed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cash_total", sa.Numeric(10, 2), nullable=True),
        sa.Column("card_total", sa.Numeric(10, 2), nullable=True),
        sa.Column("transfer_total", sa.Numeric(10, 2), nullable=True),
        sa.Column("other_total", sa.Numeric(10, 2), nullable=True),
        sa.Column("withdrawals_total", sa.Numeric(10, 2), nullable=True),
        sa.Column("expected_cash", sa.Numeric(10, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "cashwithdrawal",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column(
            "shift_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cashregistershift.id"), nullable=False, index=True
        ),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("motivo", sa.Text, nullable=False),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "product",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("gym.id"), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("stock", sa.Integer, nullable=False, server_default="0"),
        sa.Column("low_stock_threshold", sa.Integer, nullable=False, server_default="5"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "paymentitem",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payment.id"), nullable=False, index=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("product.id"), nullable=False, index=True),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("paymentitem")
    op.drop_table("product")
    op.drop_table("cashwithdrawal")
    op.drop_table("cashregistershift")
