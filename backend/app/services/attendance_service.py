import uuid
from datetime import UTC, date, datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundException
from app.models.attendance import AttendanceLog
from app.models.membership import MemberMembership
from app.repositories.attendance_repository import AttendanceLogRepository
from app.repositories.gym_repository import GymRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.membership_repository import MemberMembershipRepository
from app.schemas.attendance import AttendanceResponse


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.repo = AttendanceLogRepository(db)
        self.member_repo = MemberRepository(db)
        self.membership_repo = MemberMembershipRepository(db)
        self.gym_repo = GymRepository(db)
        self.db = db

    @staticmethod
    def _to_response(log: AttendanceLog) -> AttendanceResponse:
        name = f"{log.member.first_name} {log.member.last_name}" if log.member else None
        return AttendanceResponse(
            id=str(log.id),
            member_id=str(log.member_id),
            member_name=name,
            check_in=log.check_in,
            check_out=log.check_out,
        )

    async def _gym_timezone(self, gym_id: uuid.UUID) -> str:
        gym = await self.gym_repo.get_by_id(gym_id)
        return gym.timezone if gym and gym.timezone else "UTC"

    async def check_in(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> AttendanceResponse:
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

        created.member = member
        return self._to_response(created)

    async def check_out(self, log_id: uuid.UUID, gym_id: uuid.UUID) -> AttendanceResponse:
        log = await self.repo.get_by_id(log_id)
        if not log:
            raise NotFoundException("Attendance log not found")

        member = await self.member_repo.get_by_id(log.member_id, gym_id)
        if not member:
            raise NotFoundException("Attendance log not found")

        if log.check_out:
            raise AppException("Already checked out", status_code=409)

        log.check_out = datetime.now(UTC)
        updated = await self.repo.update(log)
        return self._to_response(updated)

    async def list_attendance(
        self, gym_id: uuid.UUID, log_date: date | None = None, member_id: uuid.UUID | None = None
    ) -> list[AttendanceResponse]:
        logs = await self.repo.list_by_gym(gym_id, log_date, member_id)
        return [self._to_response(log) for log in logs]

    async def get_today(self, gym_id: uuid.UUID) -> dict:
        tz_str = await self._gym_timezone(gym_id)
        total, active = await self.repo.get_today_summary(gym_id, tz_str)
        return {"total_checkins": total, "active_now": active}
