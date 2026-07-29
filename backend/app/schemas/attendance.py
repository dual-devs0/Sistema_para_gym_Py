from datetime import datetime

from pydantic import BaseModel, Field


class CheckInRequest(BaseModel):
    member_id: str


class AttendanceResponse(BaseModel):
    id: str
    member_id: str
    member_name: str | None = None
    check_in: datetime
    check_out: datetime | None = None

    model_config = {"from_attributes": True}


class AttendanceTodayResponse(BaseModel):
    total_checkins: int
    active_now: int
