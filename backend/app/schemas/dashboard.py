from pydantic import BaseModel


class DashboardSummary(BaseModel):
    revenue_today: float = 0
    revenue_month: float = 0
    active_members: int = 0
    frozen_members: int = 0
    cancelled_members: int = 0
    new_members_month: int = 0
    checkins_today: int = 0
    members_expiring_soon: int = 0


class RevenueChart(BaseModel):
    labels: list[str]
    data: list[float]


class AttendanceChart(BaseModel):
    labels: list[str]
    data: list[int]


class ExpiringMembership(BaseModel):
    membership_id: str
    member_id: str
    member_name: str
    plan_id: str
    plan_name: str
    end_date: str
    status: str
