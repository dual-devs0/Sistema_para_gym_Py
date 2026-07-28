import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_gym_id, get_current_user, require_role
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberResponse, MemberUpdate

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=list[MemberResponse])
async def list_members(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    result = await db.execute(
        select(Member).where(Member.gym_id == gym_id, Member.deleted_at.is_(None)).order_by(Member.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "trainer", "receptionist")),
):
    result = await db.execute(
        select(Member).where(Member.id == member_id, Member.gym_id == gym_id, Member.deleted_at.is_(None))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundException("Member", str(member_id))
    return member


@router.post("", response_model=MemberResponse, status_code=201)
async def create_member(
    body: MemberCreate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "receptionist")),
):
    member = Member(gym_id=gym_id, **body.model_dump())
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: uuid.UUID,
    body: MemberUpdate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "receptionist")),
):
    result = await db.execute(
        select(Member).where(Member.id == member_id, Member.gym_id == gym_id, Member.deleted_at.is_(None))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundException("Member", str(member_id))

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(member, key, value)

    await db.flush()
    await db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=204)
async def delete_member(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin")),
):
    result = await db.execute(
        select(Member).where(Member.id == member_id, Member.gym_id == gym_id, Member.deleted_at.is_(None))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundException("Member", str(member_id))

    member.deleted_at = datetime.now(timezone.utc)
    await db.flush()
