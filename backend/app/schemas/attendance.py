from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CheckInRequest(BaseModel):
    member_id: str


class AttendanceResponse(BaseModel):
    id: str
    member_id: str
    member_name: str | None = None
    check_in: datetime
    check_out: datetime | None = None

    model_config = {"from_attributes": True}

    @field_validator("id", "member_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class AttendanceTodayResponse(BaseModel):
    total_checkins: int
    active_now: int
