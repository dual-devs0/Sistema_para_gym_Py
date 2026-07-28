import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_role
from app.core.database import get_db
from app.schemas.payment import DashboardSummary, RevenueChart
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def summary(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin")),
):
    service = DashboardService(db)
    return await service.get_summary(gym_id)


@router.get("/revenue", response_model=RevenueChart)
async def revenue(
    days: int = Query(30, ge=1, le=365),
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin")),
):
    service = DashboardService(db)
    return await service.get_revenue_chart(gym_id, days)


@router.get("/attendance")
async def attendance(
    days: int = Query(7, ge=1, le=90),
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin")),
):
    service = DashboardService(db)
    return await service.get_attendance_chart(gym_id, days)


@router.get("/expiring")
async def expiring(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin")),
):
    service = DashboardService(db)
    return await service.get_expiring(gym_id)
