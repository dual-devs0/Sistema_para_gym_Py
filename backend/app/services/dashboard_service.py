import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.attendance_repository import AttendanceLogRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.membership_repository import MemberMembershipRepository
from app.repositories.payment_repository import PaymentRepository


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.member_repo = MemberRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.attendance_repo = AttendanceLogRepository(db)
        self.membership_repo = MemberMembershipRepository(db)

    async def get_summary(self, gym_id: uuid.UUID) -> dict:
        revenue_today = await self.payment_repo.get_revenue_today(gym_id)
        revenue_month = await self.payment_repo.get_revenue_month(gym_id)
        active_members = await self.member_repo.count_active(gym_id)
        frozen_members = await self.member_repo.count_by_status(gym_id, "frozen")
        cancelled_members = await self.member_repo.count_by_status(gym_id, "cancelled")
        new_members = await self.member_repo.count_new_this_month(gym_id)
        checkins_today = await self.attendance_repo.count_today_by_gym(gym_id)
        expiring = await self.membership_repo.count_expiring_soon(gym_id)

        return {
            "revenue_today": revenue_today,
            "revenue_month": revenue_month,
            "active_members": active_members,
            "frozen_members": frozen_members,
            "cancelled_members": cancelled_members,
            "new_members_month": new_members,
            "checkins_today": checkins_today,
            "members_expiring_soon": expiring,
        }

    async def get_revenue_chart(self, gym_id: uuid.UUID, days: int = 30) -> dict:
        since = datetime.combine(date.today() - timedelta(days=days - 1), datetime.min.time(), tzinfo=timezone.utc)
        payments = await self.payment_repo.list_paid_since(gym_id, since)

        daily = {}
        for i in range(days):
            day = date.today() - timedelta(days=days - 1 - i)
            daily[day.isoformat()] = 0.0

        for p in payments:
            if p.paid_at:
                key = p.paid_at.date().isoformat()
                daily[key] = daily.get(key, 0) + float(p.amount)

        return {"labels": list(daily.keys()), "data": list(daily.values())}

    async def get_attendance_chart(self, gym_id: uuid.UUID, days: int = 7) -> dict:
        since = datetime.combine(date.today() - timedelta(days=days - 1), datetime.min.time(), tzinfo=timezone.utc)
        logs = await self.attendance_repo.list_since(since)

        daily = {}
        for i in range(days):
            day = date.today() - timedelta(days=days - 1 - i)
            daily[day.isoformat()] = 0

        for log in logs:
            key = log.check_in.date().isoformat()
            daily[key] = daily.get(key, 0) + 1

        return {"labels": list(daily.keys()), "data": list(daily.values())}

    async def get_expiring(self, gym_id: uuid.UUID) -> list[dict]:
        memberships = await self.membership_repo.list_expiring_soon(gym_id)
        return [
            {
                "membership_id": str(m.id),
                "member_id": str(m.member_id),
                "member_name": f"{m.member.first_name} {m.member.last_name}",
                "plan_id": str(m.plan_id),
                "plan_name": m.plan.name,
                "end_date": m.end_date.isoformat(),
                "status": m.status,
            }
            for m in memberships
        ]
