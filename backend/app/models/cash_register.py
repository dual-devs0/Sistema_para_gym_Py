import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class CashRegisterShift(Base, TimestampMixin, UUIDMixin):
    """A cash-register work shift. The consolidado fields (cash_total,
    card_total, ...) stay NULL while the shift is open and are computed +
    persisted once, at close time, from the real Payment/CashWithdrawal rows
    for the shift window — never entered by hand and never recalculated
    afterwards, so the historical record stays fixed."""

    __table_args__ = (
        # Enforces "one open shift per gym" at the DB level, not just via the
        # service's check-then-insert (which has a real race window — two
        # concurrent opens could both pass the pre-check and corrupt the
        # close-time consolidado, unlike the lower-stakes double-checkin
        # race elsewhere in the app). CashRegisterService.open() catches the
        # resulting IntegrityError and turns it into the same AppException
        # the pre-check raises.
        Index(
            "ix_cashregistershift_one_open_per_gym",
            "gym_id",
            unique=True,
            postgresql_where=text("status = 'open'"),
        ),
    )

    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    opened_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=True
    )  # noqa: E501
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    opening_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="open", nullable=False)

    closed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=True
    )  # noqa: E501
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    cash_total: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    card_total: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    transfer_total: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    other_total: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    withdrawals_total: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    expected_cash: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)


class CashWithdrawal(Base, TimestampMixin, UUIDMixin):
    """A manual cash outflow during an open shift (e.g. buying cleaning
    supplies). motivo is mandatory for the same traceability reason as
    MemberBalanceMovement.motivo in Fase 4."""

    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    shift_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cashregistershift.id"), nullable=False, index=True
    )  # noqa: E501
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=True
    )  # noqa: E501

    shift = relationship("CashRegisterShift")
