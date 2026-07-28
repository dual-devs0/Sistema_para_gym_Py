import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class User(Base, TimestampMixin, SoftDeleteMixin, UUIDMixin):
    gym_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gym.id"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(String(30), default="member")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[str | None] = mapped_column(String(50), nullable=True)

    gym = relationship("Gym", back_populates="users")
