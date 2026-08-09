import uuid
from datetime import date, datetime, time, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance import AttendanceLog
from app.models.member import Member
from app.utils.date_helpers import day_start_local


class AttendanceLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, log_id: uuid.UUID) -> AttendanceLog | None:
        result = await self.db.execute(
            select(AttendanceLog)
            .where(AttendanceLog.id == log_id)
            .options(selectinload(AttendanceLog.member))
        )
        return result.scalar_one_or_none()

    async def get_today_checkin(self, member_id: uuid.UUID) -> AttendanceLog | None:
        today_start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
        result = await self.db.execute(
            select(AttendanceLog).where(
                AttendanceLog.member_id == member_id,
                AttendanceLog.check_in >= today_start,
                AttendanceLog.check_out.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_by_gym(
        self, gym_id: uuid.UUID, log_date: date | None = None, member_id: uuid.UUID | None = None
    ) -> list[AttendanceLog]:
        query = (
            select(AttendanceLog)
            .join(Member)
            .where(Member.gym_id == gym_id, Member.deleted_at.is_(None))
            .options(selectinload(AttendanceLog.member))
            .order_by(AttendanceLog.check_in.desc())
        )
        if log_date:
            day_start = datetime.combine(log_date, time.min, tzinfo=timezone.utc)
            day_end = datetime.combine(log_date, time.max, tzinfo=timezone.utc)
            query = query.where(and_(AttendanceLog.check_in >= day_start, AttendanceLog.check_in <= day_end))
        if member_id:
            query = query.where(AttendanceLog.member_id == member_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_today_summary(self, gym_id: uuid.UUID, tz_str: str = "UTC") -> tuple[int, int]:
        today_start = day_start_local(tz_str)
        result = await self.db.execute(
            select(AttendanceLog)
            .join(Member)
            .where(Member.gym_id == gym_id, Member.deleted_at.is_(None), AttendanceLog.check_in >= today_start)
        )
        logs = result.scalars().all()
        total = len(logs)
        active = sum(1 for log in logs if log.check_out is None)
        return total, active

    async def count_today_by_gym(self, gym_id: uuid.UUID, tz_str: str = "UTC") -> int:
        today_start = day_start_local(tz_str)
        result = await self.db.execute(
            select(func.count()).select_from(AttendanceLog)
            .join(Member)
            .where(Member.gym_id == gym_id, Member.deleted_at.is_(None), AttendanceLog.check_in >= today_start)
        )
        return result.scalar() or 0

    async def list_since(self, since: datetime) -> list[AttendanceLog]:
        result = await self.db.execute(
            select(AttendanceLog).where(AttendanceLog.check_in >= since)
        )
        return list(result.scalars().all())

    async def create(self, log: AttendanceLog) -> AttendanceLog:
        self.db.add(log)
        await self.db.flush()
        await self.db.refresh(log)
        return log

    async def update(self, log: AttendanceLog) -> AttendanceLog:
        await self.db.flush()
        await self.db.refresh(log)
        return log
