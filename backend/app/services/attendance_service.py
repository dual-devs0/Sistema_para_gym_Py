import uuid
from datetime import UTC, date, datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundException
from app.models.attendance import AttendanceLog
from app.models.membership import MemberMembership
from app.repositories.attendance_repository import AttendanceLogRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.membership_repository import MemberMembershipRepository


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.repo = AttendanceLogRepository(db)
        self.member_repo = MemberRepository(db)
        self.membership_repo = MemberMembershipRepository(db)
        self.db = db

    async def check_in(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> AttendanceLog:
        member = await self.member_repo.get_by_id(member_id, gym_id)
        if not member:
            raise NotFoundException("Member not found")

        existing = await self.repo.get_today_checkin(member_id)
        if existing:
            raise AppException("Member already checked in today", status_code=409)

        active_membership = await self.membership_repo.get_active_by_member(member_id)
        membership_id = active_membership.id if active_membership else None

        log = AttendanceLog(member_id=member_id, member_membership_id=membership_id)
        created = await self.repo.create(log)

        if active_membership and active_membership.remaining_visits is not None:
            stmt = (
                update(MemberMembership)
                .where(MemberMembership.id == active_membership.id, MemberMembership.remaining_visits > 0)
                .values(remaining_visits=MemberMembership.remaining_visits - 1)
            )
            await self.db.execute(stmt)

        return created

    async def check_out(self, log_id: uuid.UUID, gym_id: uuid.UUID) -> AttendanceLog:
        log = await self.repo.get_by_id(log_id)
        if not log:
            raise NotFoundException("Attendance log not found")

        member = await self.member_repo.get_by_id(log.member_id, gym_id)
        if not member:
            raise NotFoundException("Attendance log not found")

        if log.check_out:
            raise AppException("Already checked out", status_code=409)

        log.check_out = datetime.now(UTC)
        return await self.repo.update(log)

    async def list_attendance(
        self, gym_id: uuid.UUID, log_date: date | None = None, member_id: uuid.UUID | None = None
    ) -> list[AttendanceLog]:
        return await self.repo.list_by_gym(gym_id, log_date, member_id)

    async def get_today(self, gym_id: uuid.UUID) -> dict:
        total, active = await self.repo.get_today_summary(gym_id)
        return {"total_checkins": total, "active_now": active}
