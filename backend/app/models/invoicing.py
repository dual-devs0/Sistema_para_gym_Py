import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class GymFiscalConfig(Base, TimestampMixin, UUIDMixin):
    """One row per gym. White-label by design: the fiscal issuer is always
    the client gym (their RUC, their razon social), never "GymPro" as a
    platform brand. No certificate columns here — that's Sub-entrega 3b,
    blocked until a real PSC certificate is available to inspect."""

    gym_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, unique=True, index=True
    )  # noqa: E501
    ruc: Mapped[str | None] = mapped_column(String(20), nullable=True)
    razon_social: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sifen_environment: Mapped[str] = mapped_column(String(20), default="test")

    gym = relationship("Gym")


class Timbrado(Base, TimestampMixin, UUIDMixin):
    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    establecimiento: Mapped[str] = mapped_column(String(3), nullable=False)
    punto_expedicion: Mapped[str] = mapped_column(String(3), nullable=False)
    numero_desde: Mapped[int] = mapped_column(Integer, nullable=False)
    numero_hasta: Mapped[int] = mapped_column(Integer, nullable=False)
    numero_actual: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    gym = relationship("Gym")


class SifenDocument(Base, TimestampMixin, UUIDMixin):
    """1:1 with Payment. Kept separate from the simple Invoice(invoice_number,
    pdf_url) that already exists since Fase 1 — that one keeps working as the
    internal receipt number regardless of SIFEN state."""

    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payment.id"), nullable=False, unique=True, index=True
    )  # noqa: E501
    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    cdc: Mapped[str | None] = mapped_column(String(44), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending_stamping")
    environment: Mapped[str] = mapped_column(String(20), default="test")
    xml_unsigned: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    protocol_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    payment = relationship("Payment", back_populates="sifen_document")
