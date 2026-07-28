from datetime import datetime

from pydantic import BaseModel


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
    amount: float
    payment_method: str = "efectivo"
    reference: str | None = None
    notes: str | None = None

