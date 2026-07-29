import uuid

import pytest

from app.core.exceptions import ConflictException, NotFoundException
from app.services.user_service import UserService
from app.models.user import User


@pytest.mark.asyncio
async def test_create_user(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    user = await service.create("test@test.com", "Secure123!", "Test User", "trainer", gym_id)
    assert user.email == "test@test.com"
    assert user.gym_id == gym_id
    assert user.role == "trainer"


@pytest.mark.asyncio
async def test_create_duplicate_email(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    await service.create("dup@test.com", "Secure123!", "First", "admin", gym_id)
    with pytest.raises(ConflictException):
        await service.create("dup@test.com", "Secure123!", "Second", "admin", gym_id)


@pytest.mark.asyncio
async def test_get_user_not_found(db_session):
    service = UserService(db_session)
    with pytest.raises(NotFoundException):
        await service.get_by_id(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_update_user_restricted_fields(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    user = await service.create("update@test.com", "Secure123!", "Original", "trainer", gym_id)
    updated = await service.update(user.id, gym_id, {"full_name": "Updated", "role": "owner"})
    assert updated.full_name == "Updated"
    assert updated.role == "trainer"


@pytest.mark.asyncio
async def test_list_by_gym(db_session):
    service = UserService(db_session)
    g1 = uuid.uuid4()
    g2 = uuid.uuid4()
    await service.create("a@a.com", "Secure123!", "A", "trainer", g1)
    await service.create("b@b.com", "Secure123!", "B", "trainer", g2)
    assert len(await service.list_by_gym(g1)) == 1
    assert len(await service.list_by_gym(g2)) == 1


@pytest.mark.asyncio
async def test_soft_delete(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    user = await service.create("del@test.com", "Secure123!", "Delete", "trainer", gym_id)
    await service.delete(user.id, gym_id)
    with pytest.raises(NotFoundException):
        await service.get_by_id(user.id, gym_id)
