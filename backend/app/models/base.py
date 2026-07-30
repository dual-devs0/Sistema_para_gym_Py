import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


class Base(DeclarativeBase):
    @declared_attr
    def __tablename__(cls) -> str:  # noqa: N805
        return cls.__name__.lower()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )  # noqa: E501


class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)


class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class RoleEnum(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    TRAINER = "trainer"
    RECEPTIONIST = "receptionist"
