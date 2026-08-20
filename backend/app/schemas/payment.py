from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PaymentResponse(BaseModel):
    id: str
    gym_id: str
    member_id: str
    member_name: str | None = None
    member_membership_id: str | None = None
    amount: float
    payment_method: str
    reference: str | None = None
    status: str
    paid_at: datetime | None = None
    notes: str | None = None
    sifen_status: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "gym_id", "member_id", "member_membership_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class RegisterPaymentRequest(BaseModel):
    member_id: str
    member_membership_id: str | None = None
    amount: float = Field(..., gt=0)
    payment_method: str = Field(default="efectivo", max_length=50)
    reference: str | None = Field(None, max_length=200)
    notes: str | None = Field(None, max_length=2000)
