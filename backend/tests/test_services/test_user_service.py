import uuid

import pytest

from app.core.exceptions import ConflictException, NotFoundException
from app.services.user_service import UserService


@pytest.mark.asyncio
async def test_create_user(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    user = await service.create("user@test.com", "pass123", "Test User", "trainer", gym_id)
    assert user.email == "user@test.com"
    assert user.full_name == "Test User"
    assert user.role == "trainer"
    assert user.gym_id == gym_id


@pytest.mark.asyncio
async def test_create_duplicate_email(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    await service.create("dup@test.com", "pass", "First", "trainer", gym_id)
    with pytest.raises(ConflictException):
        await service.create("dup@test.com", "pass", "Second", "trainer", gym_id)


@pytest.mark.asyncio
async def test_get_user_not_found(db_session):
    service = UserService(db_session)
    with pytest.raises(NotFoundException):
        await service.get_by_id(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_list_users_by_gym(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    await service.create("a@test.com", "pass", "A", "trainer", gym_id)
    await service.create("b@test.com", "pass", "B", "trainer", gym_id)
    users = await service.list_by_gym(gym_id)
    assert len(users) == 2


@pytest.mark.asyncio
async def test_invite_returns_temp_password(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    user, temp_password = await service.invite("invited@test.com", "Invited", "receptionist", gym_id)
    assert user.email == "invited@test.com"
    assert temp_password is not None
    assert len(temp_password) > 0


@pytest.mark.asyncio
async def test_soft_delete_user(db_session):
    service = UserService(db_session)
    gym_id = uuid.uuid4()
    user = await service.create("delete@test.com", "pass", "Delete", "trainer", gym_id)
    await service.delete(user.id, gym_id)
    with pytest.raises(NotFoundException):
        await service.get_by_id(user.id, gym_id)
