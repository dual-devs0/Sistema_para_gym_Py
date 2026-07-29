from datetime import datetime

from pydantic import BaseModel, Field


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
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterPaymentRequest(BaseModel):
    member_id: str
    member_membership_id: str | None = None
    amount: float = Field(..., gt=0)
    payment_method: str = Field(default="efectivo", max_length=50)
    reference: str | None = Field(None, max_length=200)
    notes: str | None = Field(None, max_length=2000)
