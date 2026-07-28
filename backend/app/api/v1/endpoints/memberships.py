import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_role
from app.core.database import get_db
from app.schemas.membership import AssignPlanRequest, MemberMembershipResponse
from app.services.membership_service import MemberMembershipService

router = APIRouter(prefix="/memberships", tags=["memberships"])


@router.get("", response_model=list[MemberMembershipResponse])
async def list_memberships(
    status: str | None = Query(None),
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    service = MemberMembershipService(db)
    return await service.list_by_gym(gym_id, status)


@router.get("/member/{member_id}", response_model=list[MemberMembershipResponse])
async def list_member_memberships(
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    service = MemberMembershipService(db)
    return await service.list_by_member(member_id)


@router.post("/assign/{member_id}", response_model=MemberMembershipResponse, status_code=201)
async def assign_plan(
    member_id: uuid.UUID,
    body: AssignPlanRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "receptionist")),
):
    service = MemberMembershipService(db)
    return await service.assign(member_id, uuid.UUID(body.plan_id), gym_id, body.model_dump())


@router.put("/{membership_id}/cancel", response_model=MemberMembershipResponse)
async def cancel_membership(
    membership_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin")),
):
    service = MemberMembershipService(db)
    return await service.cancel(membership_id, gym_id)


@router.put("/{membership_id}/renew", response_model=MemberMembershipResponse)
async def renew_membership(
    membership_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "receptionist")),
):
    service = MemberMembershipService(db)
    return await service.renew(membership_id, gym_id)
