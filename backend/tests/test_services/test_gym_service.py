import uuid

import pytest

from app.core.exceptions import NotFoundException
from app.models.gym import Gym
from app.services.gym_service import GymService


@pytest.mark.asyncio
async def test_get_settings_not_found(db_session):
    service = GymService(db_session)
    with pytest.raises(NotFoundException):
        await service.get_settings(uuid.uuid4())


@pytest.mark.asyncio
async def test_update_settings_not_found(db_session):
    service = GymService(db_session)
    with pytest.raises(NotFoundException):
        await service.update_settings(uuid.uuid4(), {"name": "Test"})


@pytest.mark.asyncio
async def test_update_settings_updates_fields(db_session):
    service = GymService(db_session)
    gym = Gym(name="Original", slug="original")
    db_session.add(gym)
    await db_session.flush()

    updated = await service.update_settings(gym.id, {"name": "Updated"})
    assert updated.name == "Updated"
    assert updated.slug == "original"
