import uuid

import pytest

from app.core.exceptions import NotFoundException
from app.services.member_service import MemberService


@pytest.mark.asyncio
async def test_create_member(db_session):
    service = MemberService(db_session)
    gym_id = uuid.uuid4()
    member = await service.create(gym_id, {"first_name": "Juan", "last_name": "Pérez"})
    assert member.first_name == "Juan"
    assert member.last_name == "Pérez"
    assert member.gym_id == gym_id
    assert member.status == "active"


@pytest.mark.asyncio
async def test_get_member_by_id(db_session):
    service = MemberService(db_session)
    gym_id = uuid.uuid4()
    created = await service.create(gym_id, {"first_name": "Ana", "last_name": "López"})
    found = await service.get_by_id(created.id, gym_id)
    assert found.id == created.id
    assert found.first_name == "Ana"


@pytest.mark.asyncio
async def test_get_member_not_found(db_session):
    service = MemberService(db_session)
    with pytest.raises(NotFoundException):
        await service.get_by_id(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_list_members_by_gym(db_session):
    service = MemberService(db_session)
    gym_id = uuid.uuid4()
    await service.create(gym_id, {"first_name": "A", "last_name": "B"})
    await service.create(gym_id, {"first_name": "C", "last_name": "D"})
    members = await service.list_by_gym(gym_id)
    assert len(members) == 2


@pytest.mark.asyncio
async def test_list_members_other_gym_isolation(db_session):
    service = MemberService(db_session)
    gym_a = uuid.uuid4()
    gym_b = uuid.uuid4()
    await service.create(gym_a, {"first_name": "A", "last_name": "B"})
    await service.create(gym_b, {"first_name": "C", "last_name": "D"})
    members_a = await service.list_by_gym(gym_a)
    members_b = await service.list_by_gym(gym_b)
    assert len(members_a) == 1
    assert len(members_b) == 1


@pytest.mark.asyncio
async def test_update_member(db_session):
    service = MemberService(db_session)
    gym_id = uuid.uuid4()
    member = await service.create(gym_id, {"first_name": "Old", "last_name": "Name"})
    updated = await service.update(member.id, gym_id, {"first_name": "New", "phone": "555-0100"})
    assert updated.first_name == "New"
    assert updated.phone == "555-0100"


@pytest.mark.asyncio
async def test_delete_member_soft_delete(db_session):
    service = MemberService(db_session)
    gym_id = uuid.uuid4()
    member = await service.create(gym_id, {"first_name": "Del", "last_name": "User"})
    await service.delete(member.id, gym_id)
    with pytest.raises(NotFoundException):
        await service.get_by_id(member.id, gym_id)


@pytest.mark.asyncio
async def test_get_deleted_member_from_other_gym(db_session):
    service = MemberService(db_session)
    gym_id = uuid.uuid4()
    member = await service.create(gym_id, {"first_name": "X", "last_name": "Y"})
    other_gym = uuid.uuid4()
    with pytest.raises(NotFoundException):
        await service.get_by_id(member.id, other_gym)
