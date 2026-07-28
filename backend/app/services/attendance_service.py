import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundException
from app.models.attendance import AttendanceLog
from app.models.member import Member
from app.models.membership import MemberMembership
from app.repositories.attendance_repository import AttendanceLogRepository


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.repo = AttendanceLogRepository(db)
        self.db = db

    async def check_in(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> AttendanceLog:
        result = await self.db.execute(
            select(Member).where(Member.id == member_id, Member.gym_id == gym_id, Member.deleted_at.is_(None))
        )
        member = result.scalar_one_or_none()
        if not member:
            raise NotFoundException("Member", str(member_id))

        existing = await self.repo.get_today_checkin(member_id)
        if existing:
            raise AppException("Member already checked in today", status_code=409)

        result = await self.db.execute(
            select(MemberMembership).where(
                MemberMembership.member_id == member_id,
                MemberMembership.status == "active",
                MemberMembership.end_date >= date.today(),
            )
        )
        active_membership = result.scalar_one_or_none()
        membership_id = active_membership.id if active_membership else None

        log = AttendanceLog(member_id=member_id, member_membership_id=membership_id)
        created = await self.repo.create(log)

        if active_membership and active_membership.remaining_visits is not None:
            active_membership.remaining_visits -= 1

        return created

    async def check_out(self, log_id: uuid.UUID, gym_id: uuid.UUID) -> AttendanceLog:
        log = await self.repo.get_by_id(log_id)
        if not log:
            raise NotFoundException("AttendanceLog", str(log_id))

        result = await self.db.execute(
            select(Member).where(Member.id == log.member_id, Member.gym_id == gym_id)
        )
        if not result.scalar_one_or_none():
            raise NotFoundException("AttendanceLog", str(log_id))

        if log.check_out:
            raise AppException("Already checked out", status_code=409)

        log.check_out = datetime.now(timezone.utc)
        return await self.repo.update(log)

    async def list_attendance(
        self, gym_id: uuid.UUID, log_date: date | None = None, member_id: uuid.UUID | None = None
    ) -> list[AttendanceLog]:
        return await self.repo.list_by_gym(gym_id, log_date, member_id)

    async def get_today(self, gym_id: uuid.UUID) -> dict:
        total, active = await self.repo.get_today_summary(gym_id)
        return {"total_checkins": total, "active_now": active}
