import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import NotificationLog


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log: NotificationLog) -> NotificationLog:
        self.db.add(log)
        await self.db.flush()
        await self.db.refresh(log)
        return log

    async def list_by_member(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> list[NotificationLog]:
        result = await self.db.execute(
            select(NotificationLog)
            .where(NotificationLog.member_id == member_id, NotificationLog.gym_id == gym_id)
            .order_by(NotificationLog.created_at.desc())
        )
        return list(result.scalars().all())

    async def exists_for_membership(self, member_membership_id: uuid.UUID, type_: str) -> bool:
        result = await self.db.execute(
            select(NotificationLog.id).where(
                NotificationLog.member_membership_id == member_membership_id,
                NotificationLog.type == type_,
            )
        )
        return result.scalar_one_or_none() is not None
