from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class NotificationLogResponse(BaseModel):
    id: str
    member_id: str
    member_membership_id: str | None = None
    type: str
    status: str
    error_message: str | None = None
    sent_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "member_id", "member_membership_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v
