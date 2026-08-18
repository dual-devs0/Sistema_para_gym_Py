import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gym import Gym


class GymRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, gym_id: uuid.UUID) -> Gym | None:
        result = await self.db.execute(select(Gym).where(Gym.id == gym_id))
        return result.scalar_one_or_none()

    async def update(self, gym: Gym) -> Gym:
        await self.db.flush()
        await self.db.refresh(gym)
        return gym

    async def list_active_with_notifications_enabled(self) -> list[Gym]:
        result = await self.db.execute(
            select(Gym).where(Gym.is_active.is_(True), Gym.notifications_enabled.is_(True))
        )
        return list(result.scalars().all())
