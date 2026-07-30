import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class AttendanceLog(Base, TimestampMixin, UUIDMixin):
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("member.id"), nullable=False, index=True
    )  # noqa: E501
    member_membership_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("membermembership.id"), nullable=True
    )  # noqa: E501
    check_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    member = relationship("Member", back_populates="attendance_logs")
