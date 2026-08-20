from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CashShiftOpenRequest(BaseModel):
    opening_amount: float = Field(..., ge=0)


class CashWithdrawalRequest(BaseModel):
    amount: float = Field(..., gt=0)
    motivo: str = Field(..., min_length=1, max_length=500)


class CashWithdrawalResponse(BaseModel):
    id: str
    shift_id: str
    amount: float
    motivo: str
    created_by_user_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "shift_id", "created_by_user_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class CashShiftResponse(BaseModel):
    id: str
    opened_by_user_id: str | None = None
    opened_at: datetime
    opening_amount: float
    status: str
    closed_by_user_id: str | None = None
    closed_at: datetime | None = None
    cash_total: float | None = None
    card_total: float | None = None
    transfer_total: float | None = None
    other_total: float | None = None
    withdrawals_total: float | None = None
    expected_cash: float | None = None
    withdrawals: list[CashWithdrawalResponse] = []

    model_config = {"from_attributes": True}

    @field_validator("id", "opened_by_user_id", "closed_by_user_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v
