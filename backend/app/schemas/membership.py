from datetime import date, datetime

from pydantic import BaseModel, Field


class MembershipPlanResponse(BaseModel):
    id: str
    gym_id: str
    name: str
    description: str | None = None
    price: float
    duration_days: int
    max_visits: int | None = None
    type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MembershipPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    price: float = Field(..., gt=0)
    duration_days: int = Field(..., gt=0)
    max_visits: int | None = Field(None, gt=0)
    type: str = Field(default="mensual", max_length=30)


class MembershipPlanUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    price: float | None = Field(None, gt=0)
    duration_days: int | None = Field(None, gt=0)
    max_visits: int | None = Field(None, gt=0)
    type: str | None = Field(None, max_length=30)
    is_active: bool | None = None


class MemberMembershipResponse(BaseModel):
    id: str
    member_id: str
    plan_id: str
    plan_name: str | None = None
    start_date: date
    end_date: date
    remaining_visits: int | None = None
    price_paid: float
    status: str
    auto_renew: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AssignPlanRequest(BaseModel):
    plan_id: str
    start_date: date | None = None
    price_paid: float | None = Field(None, ge=0)
    auto_renew: bool = False
