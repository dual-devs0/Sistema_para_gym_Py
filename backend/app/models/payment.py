import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Payment(Base, TimestampMixin, UUIDMixin):
    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("member.id"), nullable=False, index=True
    )  # noqa: E501
    member_membership_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("membermembership.id"), nullable=True
    )  # noqa: E501

    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="paid")
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    gym = relationship("Gym", back_populates="payments")
    member = relationship("Member")
    invoice = relationship("Invoice", back_populates="payment", uselist=False)


class Invoice(Base, TimestampMixin, UUIDMixin):
    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payment.id"), nullable=False, unique=True
    )  # noqa: E501
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    payment = relationship("Payment", back_populates="invoice")
