import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.membership import MembershipPlan, MemberMembership


class MembershipPlanRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, plan_id: uuid.UUID) -> MembershipPlan | None:
        result = await self.db.execute(select(MembershipPlan).where(MembershipPlan.id == plan_id))
        return result.scalar_one_or_none()

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[MembershipPlan]:
        result = await self.db.execute(
            select(MembershipPlan).where(MembershipPlan.gym_id == gym_id).order_by(MembershipPlan.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, plan: MembershipPlan) -> MembershipPlan:
        self.db.add(plan)
        await self.db.flush()
        await self.db.refresh(plan)
        return plan

    async def update(self, plan: MembershipPlan) -> MembershipPlan:
        await self.db.flush()
        await self.db.refresh(plan)
        return plan

    async def soft_delete(self, plan: MembershipPlan) -> None:
        plan.is_active = False
        await self.db.flush()


class MemberMembershipRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, membership_id: uuid.UUID) -> MemberMembership | None:
        result = await self.db.execute(
            select(MemberMembership)
            .where(MemberMembership.id == membership_id)
            .options(selectinload(MemberMembership.plan))
        )
        return result.scalar_one_or_none()

    async def list_by_gym(self, gym_id: uuid.UUID, status: str | None = None) -> list[MemberMembership]:
        query = (
            select(MemberMembership)
            .join(MembershipPlan)
            .where(MembershipPlan.gym_id == gym_id)
            .options(selectinload(MemberMembership.plan), selectinload(MemberMembership.member))
            .order_by(MemberMembership.created_at.desc())
        )
        if status:
            query = query.where(MemberMembership.status == status)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_by_member(self, member_id: uuid.UUID) -> list[MemberMembership]:
        result = await self.db.execute(
            select(MemberMembership)
            .where(MemberMembership.member_id == member_id)
            .options(selectinload(MemberMembership.plan))
            .order_by(MemberMembership.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, membership: MemberMembership) -> MemberMembership:
        self.db.add(membership)
        await self.db.flush()
        await self.db.refresh(membership)
        return membership

    async def update(self, membership: MemberMembership) -> MemberMembership:
        await self.db.flush()
        await self.db.refresh(membership)
        return membership
