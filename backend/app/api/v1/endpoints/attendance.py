import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_role
from app.core.database import get_db
from app.schemas.attendance import AttendanceResponse, AttendanceTodayResponse
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/check-in", response_model=AttendanceResponse, status_code=201)
async def check_in(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    service = AttendanceService(db)
    return await service.check_in(member_id, gym_id)


@router.put("/{log_id}/check-out", response_model=AttendanceResponse)
async def check_out(
    log_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    service = AttendanceService(db)
    return await service.check_out(log_id, gym_id)


@router.get("", response_model=list[AttendanceResponse])
async def list_attendance(
    log_date: date | None = Query(None),
    member_id: uuid.UUID | None = Query(None),
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    service = AttendanceService(db)
    return await service.list_attendance(gym_id, log_date, member_id)


@router.get("/today", response_model=AttendanceTodayResponse)
async def today_summary(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    service = AttendanceService(db)
    return await service.get_today(gym_id)
