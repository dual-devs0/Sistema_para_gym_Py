import uuid

import pytest

from app.core.exceptions import NotFoundException
from app.services.membership_service import (
    MemberMembershipService,
    MembershipPlanService,
)


@pytest.mark.asyncio
async def test_create_plan(db_session, gym_id):
    service = MembershipPlanService(db_session)
    plan = await service.create(gym_id, {"name": "Mensual", "price": 499, "duration_days": 30, "type": "mensual"})
    assert plan.name == "Mensual"
    assert plan.gym_id == gym_id


@pytest.mark.asyncio
async def test_get_plan_not_found(db_session):
    service = MembershipPlanService(db_session)
    with pytest.raises(NotFoundException):
        await service.get_by_id(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_list_plans_by_gym(db_session, gym_id):
    service = MembershipPlanService(db_session)
    await service.create(gym_id, {"name": "A", "price": 100, "duration_days": 30})
    await service.create(gym_id, {"name": "B", "price": 200, "duration_days": 60})
    plans = await service.list_by_gym(gym_id)
    assert len(plans) == 2


@pytest.mark.asyncio
async def test_update_plan(db_session, gym_id):
    service = MembershipPlanService(db_session)
    plan = await service.create(gym_id, {"name": "Original", "price": 100, "duration_days": 30})
    updated = await service.update(plan.id, gym_id, {"name": "Updated", "price": 150})
    assert updated.name == "Updated"
    assert updated.price == 150


@pytest.mark.asyncio
async def test_delete_plan_deactivates(db_session, gym_id):
    service = MembershipPlanService(db_session)
    plan = await service.create(gym_id, {"name": "Del", "price": 100, "duration_days": 30})
    await service.delete(plan.id, gym_id)
    with pytest.raises(NotFoundException):
        await service.get_by_id(plan.id, gym_id)


@pytest.mark.asyncio
async def test_assign_plan(db_session, gym_id, member_id):
    plan_service = MembershipPlanService(db_session)
    member_service = MemberMembershipService(db_session)
    plan = await plan_service.create(gym_id, {"name": "Mensual", "price": 499, "duration_days": 30})
    membership = await member_service.assign(member_id, plan.id, gym_id, {})
    assert membership.member_id == member_id
    assert membership.plan_id == plan.id
    assert membership.status == "active"
    assert membership.price_paid == 499


@pytest.mark.asyncio
async def test_assign_plan_custom_price(db_session, gym_id, member_id):
    plan_service = MembershipPlanService(db_session)
    member_service = MemberMembershipService(db_session)
    plan = await plan_service.create(gym_id, {"name": "Premium", "price": 999, "duration_days": 30})
    membership = await member_service.assign(member_id, plan.id, gym_id, {"price_paid": 500})
    assert membership.price_paid == 500


@pytest.mark.asyncio
async def test_assign_plan_zero_price(db_session, gym_id, member_id):
    plan_service = MembershipPlanService(db_session)
    member_service = MemberMembershipService(db_session)
    plan = await plan_service.create(gym_id, {"name": "Free", "price": 999, "duration_days": 30})
    membership = await member_service.assign(member_id, plan.id, gym_id, {"price_paid": 0})
    assert membership.price_paid == 0


@pytest.mark.asyncio
async def test_cancel_membership(db_session, gym_id, member_id):
    plan_service = MembershipPlanService(db_session)
    member_service = MemberMembershipService(db_session)
    plan = await plan_service.create(gym_id, {"name": "Mensual", "price": 499, "duration_days": 30})
    membership = await member_service.assign(member_id, plan.id, gym_id, {})
    cancelled = await member_service.cancel(membership.id, gym_id)
    assert cancelled.status == "cancelled"


@pytest.mark.asyncio
async def test_renew_membership(db_session, gym_id, member_id):
    plan_service = MembershipPlanService(db_session)
    member_service = MemberMembershipService(db_session)
    plan = await plan_service.create(gym_id, {"name": "Mensual", "price": 499, "duration_days": 30})
    membership = await member_service.assign(member_id, plan.id, gym_id, {})
    renewed = await member_service.renew(membership.id, gym_id)
    assert renewed.renewed_from_id == membership.id
    assert renewed.status == "active"
