import uuid

from sqlalchemy import ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class MemberBalanceMovement(Base, TimestampMixin, UUIDMixin):
    """Ledger entry for a member's saldo. Signed amount: positive = credit
    (a favor), negative = debit (deudor). Member.balance is a cached sum
    kept in sync with every insert here — this table is the source of truth."""

    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("member.id"), nullable=False, index=True
    )  # noqa: E501
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=True
    )  # noqa: E501

    member = relationship("Member")
