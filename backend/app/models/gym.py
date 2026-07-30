from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Gym(Base, TimestampMixin, UUIDMixin):
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="MXN")
    timezone: Mapped[str] = mapped_column(String(50), default="America/Mexico_City")
    business_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    users = relationship("User", back_populates="gym", lazy="selectin")
    members = relationship("Member", back_populates="gym", lazy="selectin")
    membership_plans = relationship("MembershipPlan", back_populates="gym", lazy="selectin")
    payments = relationship("Payment", back_populates="gym", lazy="selectin")
