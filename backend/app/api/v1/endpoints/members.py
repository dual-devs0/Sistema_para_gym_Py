import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, get_current_user, require_permission, require_role
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.attendance import AttendanceResponse
from app.schemas.member import MemberCreate, MemberResponse, MemberUpdate
from app.schemas.membership import AssignPlanRequest, MemberMembershipResponse
from app.schemas.payment import PaymentResponse
from app.services.attendance_service import AttendanceService
from app.services.member_service import MemberService
from app.services.membership_service import MemberMembershipService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=list[MemberResponse])
async def list_members(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_READ)),
):
    service = MemberService(db)
    return await service.list_by_gym(gym_id)


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_READ)),
):
    service = MemberService(db)
    return await service.get_by_id(member_id, gym_id)


@router.post("", response_model=MemberResponse, status_code=201)
async def create_member(
    body: MemberCreate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_CREATE)),
):
    service = MemberService(db)
    return await service.create(gym_id, body.model_dump())


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: uuid.UUID,
    body: MemberUpdate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_UPDATE)),
):
    service = MemberService(db)
    return await service.update(member_id, gym_id, body.model_dump(exclude_unset=True))


@router.delete("/{member_id}", status_code=204)
async def delete_member(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_DELETE)),
):
    service = MemberService(db)
    await service.delete(member_id, gym_id)


@router.get("/{member_id}/attendance", response_model=list[AttendanceResponse])
async def get_member_attendance(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.ATTENDANCE_READ)),
):
    member_service = MemberService(db)
    await member_service.get_by_id(member_id, gym_id)
    attendance_service = AttendanceService(db)
    return await attendance_service.list_attendance(gym_id, member_id=member_id)


@router.get("/{member_id}/payments", response_model=list[PaymentResponse])
async def get_member_payments(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PAYMENT_READ)),
):
    member_service = MemberService(db)
    await member_service.get_by_id(member_id, gym_id)
    payment_service = PaymentService(db)
    return await payment_service.list_by_member(member_id, gym_id)


@router.get("/{member_id}/memberships", response_model=list[MemberMembershipResponse])
async def get_member_memberships(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBERSHIP_READ)),
):
    member_service = MemberService(db)
    await member_service.get_by_id(member_id, gym_id)
    membership_service = MemberMembershipService(db)
    return await membership_service.list_by_member(member_id)


@router.post("/{member_id}/memberships", response_model=MemberMembershipResponse, status_code=201)
async def assign_plan_to_member(
    member_id: uuid.UUID,
    body: AssignPlanRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBERSHIP_ASSIGN)),
):
    member_service = MemberService(db)
    await member_service.get_by_id(member_id, gym_id)
    membership_service = MemberMembershipService(db)
    return await membership_service.assign(member_id, uuid.UUID(body.plan_id), gym_id, body.model_dump())
