from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MemberBalanceMovementResponse(BaseModel):
    id: str
    member_id: str
    amount: float
    motivo: str
    created_by_user_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "member_id", "created_by_user_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class MemberBalanceAdjustRequest(BaseModel):
    amount: float = Field(..., description="Positive = a favor, negative = deudor")
    motivo: str = Field(..., min_length=1, max_length=500)
