import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.gym import Gym
from app.repositories.gym_repository import GymRepository


class GymService:
    def __init__(self, db: AsyncSession):
        self.repo = GymRepository(db)

    async def get_settings(self, gym_id: uuid.UUID) -> Gym:
        gym = await self.repo.get_by_id(gym_id)
        if not gym:
            raise NotFoundException("Gym", str(gym_id))
        return gym

    async def update_settings(self, gym_id: uuid.UUID, data: dict) -> Gym:
        gym = await self.repo.get_by_id(gym_id)
        if not gym:
            raise NotFoundException("Gym", str(gym_id))
        for key, value in data.items():
            if value is not None:
                setattr(gym, key, value)
        return await self.repo.update(gym)
