from datetime import date, datetime

from pydantic import BaseModel


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
    name: str
    description: str | None = None
    price: float
    duration_days: int
    max_visits: int | None = None
    type: str = "mensual"


class MembershipPlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    duration_days: int | None = None
    max_visits: int | None = None
    type: str | None = None
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
    price_paid: float | None = None
    auto_renew: bool = False
