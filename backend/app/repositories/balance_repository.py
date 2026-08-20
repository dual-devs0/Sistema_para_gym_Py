import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.balance import MemberBalanceMovement


class MemberBalanceMovementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, movement: MemberBalanceMovement) -> MemberBalanceMovement:
        self.db.add(movement)
        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def list_by_member(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> list[MemberBalanceMovement]:
        result = await self.db.execute(
            select(MemberBalanceMovement)
            .where(MemberBalanceMovement.member_id == member_id, MemberBalanceMovement.gym_id == gym_id)
            .order_by(MemberBalanceMovement.created_at.desc())
        )
        return list(result.scalars().all())
