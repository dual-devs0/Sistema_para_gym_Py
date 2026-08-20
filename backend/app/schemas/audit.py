from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class AuditLogResponse(BaseModel):
    id: str
    user_id: str | None = None
    user_name: str | None = None
    action: str
    table_name: str
    record_id: str | None = None
    changes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "user_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v
