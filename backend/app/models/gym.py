from sqlalchemy import Boolean, Numeric, String
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
    currency: Mapped[str] = mapped_column(String(3), default="PYG")
    timezone: Mapped[str] = mapped_column(String(50), default="America/Asuncion")
    business_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # NULL = no limit configured yet (feature off until the owner sets one) — same
    # opt-in rollout pattern as notifications_enabled/SIFEN in earlier phases.
    debt_limit: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    users = relationship("User", back_populates="gym", lazy="selectin")
    members = relationship("Member", back_populates="gym", lazy="selectin")
    membership_plans = relationship("MembershipPlan", back_populates="gym", lazy="selectin")
    payments = relationship("Payment", back_populates="gym", lazy="selectin")
