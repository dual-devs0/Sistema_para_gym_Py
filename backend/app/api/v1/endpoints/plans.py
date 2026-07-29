import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.membership import (
    MembershipPlanCreate,
    MembershipPlanResponse,
    MembershipPlanUpdate,
)
from app.services.membership_service import MembershipPlanService

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[MembershipPlanResponse])
async def list_plans(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PLAN_READ)),
):
    service = MembershipPlanService(db)
    return await service.list_by_gym(gym_id)


@router.get("/{plan_id}", response_model=MembershipPlanResponse)
async def get_plan(
    plan_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PLAN_READ)),
):
    service = MembershipPlanService(db)
    return await service.get_by_id(plan_id, gym_id)


@router.post("", response_model=MembershipPlanResponse, status_code=201)
async def create_plan(
    body: MembershipPlanCreate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PLAN_CREATE)),
):
    service = MembershipPlanService(db)
    return await service.create(gym_id, body.model_dump())


@router.put("/{plan_id}", response_model=MembershipPlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    body: MembershipPlanUpdate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PLAN_UPDATE)),
):
    service = MembershipPlanService(db)
    return await service.update(plan_id, gym_id, body.model_dump(exclude_unset=True))


@router.delete("/{plan_id}", status_code=204)
async def delete_plan(
    plan_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PLAN_DELETE)),
):
    service = MembershipPlanService(db)
    await service.delete(plan_id, gym_id)
