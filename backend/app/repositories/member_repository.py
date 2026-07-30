import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.member import Member


class MemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> Member | None:
        result = await self.db.execute(
            select(Member).where(Member.id == member_id, Member.gym_id == gym_id, Member.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[Member]:
        result = await self.db.execute(
            select(Member).where(Member.gym_id == gym_id, Member.deleted_at.is_(None)).order_by(Member.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_active(self, gym_id: uuid.UUID) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(Member).where(Member.gym_id == gym_id, Member.status == "active", Member.deleted_at.is_(None))
        )
        return result.scalar() or 0

    async def count_by_status(self, gym_id: uuid.UUID, status: str) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(Member).where(Member.gym_id == gym_id, Member.status == status, Member.deleted_at.is_(None))
        )
        return result.scalar() or 0

    async def count_new_this_month(self, gym_id: uuid.UUID) -> int:
        from sqlalchemy import func
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.count()).select_from(Member).where(
                Member.gym_id == gym_id,
                Member.created_at >= month_start,
                Member.deleted_at.is_(None),
            )
        )
        return result.scalar() or 0

    async def create(self, member: Member) -> Member:
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def update(self, member: Member) -> Member:
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def soft_delete(self, member: Member) -> None:
        member.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
