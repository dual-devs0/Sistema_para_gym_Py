import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.membership import MembershipPlan, MemberMembership
from app.repositories.membership_repository import (
    MemberMembershipRepository,
    MembershipPlanRepository,
)


class MembershipPlanService:
    def __init__(self, db: AsyncSession):
        self.repo = MembershipPlanRepository(db)

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[MembershipPlan]:
        return await self.repo.list_by_gym(gym_id)

    async def get_by_id(self, plan_id: uuid.UUID, gym_id: uuid.UUID) -> MembershipPlan:
        plan = await self.repo.get_by_id(plan_id)
        if not plan or plan.gym_id != gym_id or not plan.is_active:
            raise NotFoundException("Plan not found")
        return plan

    async def create(self, gym_id: uuid.UUID, data: dict) -> MembershipPlan:
        plan = MembershipPlan(gym_id=gym_id, **data)
        return await self.repo.create(plan)

    async def update(self, plan_id: uuid.UUID, gym_id: uuid.UUID, data: dict) -> MembershipPlan:
        plan = await self.get_by_id(plan_id, gym_id)
        for key, value in data.items():
            if value is not None:
                setattr(plan, key, value)
        return await self.repo.update(plan)

    async def delete(self, plan_id: uuid.UUID, gym_id: uuid.UUID) -> None:
        plan = await self.get_by_id(plan_id, gym_id)
        await self.repo.soft_delete(plan)


class MemberMembershipService:
    def __init__(self, db: AsyncSession):
        self.membership_repo = MemberMembershipRepository(db)
        self.plan_repo = MembershipPlanRepository(db)

    async def list_by_gym(self, gym_id: uuid.UUID, status: str | None = None) -> list[MemberMembership]:
        return await self.membership_repo.list_by_gym(gym_id, status)

    async def list_by_member(self, member_id: uuid.UUID) -> list[MemberMembership]:
        return await self.membership_repo.list_by_member(member_id)

    async def assign(self, member_id: uuid.UUID, plan_id: uuid.UUID, gym_id: uuid.UUID, data: dict) -> MemberMembership:
        plan = await self.plan_repo.get_by_id(plan_id)
        if not plan or plan.gym_id != gym_id:
            raise NotFoundException("Plan not found")
        start_date = data.get("start_date") or date.today()
        price_paid = data.get("price_paid")
        if price_paid is None:
            price_paid = plan.price
        end_date = start_date + timedelta(days=plan.duration_days)
        membership = MemberMembership(
            member_id=member_id,
            plan_id=plan_id,
            start_date=start_date,
            end_date=end_date,
            price_paid=float(price_paid),
            remaining_visits=plan.max_visits,
            auto_renew=data.get("auto_renew", False),
        )
        return await self.membership_repo.create(membership)

    async def cancel(self, membership_id: uuid.UUID, gym_id: uuid.UUID) -> MemberMembership:
        membership = await self.membership_repo.get_by_id(membership_id)
        if not membership or membership.plan.gym_id != gym_id:
            raise NotFoundException("Membership not found")
        membership.status = "cancelled"
        return await self.membership_repo.update(membership)

    async def renew(self, membership_id: uuid.UUID, gym_id: uuid.UUID) -> MemberMembership:
        membership = await self.membership_repo.get_by_id(membership_id)
        if not membership or membership.plan.gym_id != gym_id:
            raise NotFoundException("Membership not found")
        start_date = membership.end_date
        end_date = start_date + timedelta(days=membership.plan.duration_days)
        renewed = MemberMembership(
            member_id=membership.member_id,
            plan_id=membership.plan_id,
            start_date=start_date,
            end_date=end_date,
            price_paid=float(membership.price_paid),
            remaining_visits=membership.plan.max_visits,
            auto_renew=membership.auto_renew,
            renewed_from_id=membership.id,
        )
        membership.status = "renewed"
        await self.membership_repo.update(membership)
        return await self.membership_repo.create(renewed)
