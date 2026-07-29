import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.gym import Gym
from app.repositories.gym_repository import GymRepository

ALLOWED_GYM_FIELDS = {"name", "logo_url", "address", "phone", "email", "currency", "timezone", "business_hours"}


class GymService:
    def __init__(self, db: AsyncSession):
        self.repo = GymRepository(db)

    async def get_settings(self, gym_id: uuid.UUID) -> Gym:
        gym = await self.repo.get_by_id(gym_id)
        if not gym:
            raise NotFoundException("Gym not found")
        return gym

    async def update_settings(self, gym_id: uuid.UUID, data: dict) -> Gym:
        gym = await self.repo.get_by_id(gym_id)
        if not gym:
            raise NotFoundException("Gym not found")
        for key in data:
            if key in ALLOWED_GYM_FIELDS and data[key] is not None:
                setattr(gym, key, data[key])
        return await self.repo.update(gym)
