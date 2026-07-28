import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceLog
from app.models.member import Member
from app.models.membership import MemberMembership
from app.models.payment import Payment
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import DashboardSummary, RevenueChart


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.payment_repo = PaymentRepository(db)

    async def get_summary(self, gym_id: uuid.UUID) -> DashboardSummary:
        revenue_today = await self.payment_repo.get_revenue_today(gym_id)
        revenue_month = await self.payment_repo.get_revenue_month(gym_id)

        result = await self.db.execute(
            select(func.count()).select_from(Member).where(Member.gym_id == gym_id, Member.status == "active", Member.deleted_at.is_(None))
        )
        active_members = result.scalar() or 0

        month_start = date.today().replace(day=1)
        result = await self.db.execute(
            select(func.count()).select_from(Member).where(
                Member.gym_id == gym_id, Member.created_at >= month_start, Member.deleted_at.is_(None)
            )
        )
        new_members = result.scalar() or 0

        today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
        result = await self.db.execute(
            select(func.count()).select_from(AttendanceLog)
            .join(Member)
            .where(Member.gym_id == gym_id, AttendanceLog.check_in >= today_start)
        )
        checkins_today = result.scalar() or 0

        three_days = date.today() + timedelta(days=3)
        result = await self.db.execute(
            select(func.count()).select_from(MemberMembership)
            .join(Member)
            .where(
                Member.gym_id == gym_id,
                MemberMembership.status == "active",
                MemberMembership.end_date <= three_days,
                MemberMembership.end_date >= date.today(),
            )
        )
        expiring = result.scalar() or 0

        return DashboardSummary(
            revenue_today=revenue_today,
            revenue_month=revenue_month,
            active_members=active_members,
            new_members_month=new_members,
            checkins_today=checkins_today,
            members_expiring_soon=expiring,
        )

    async def get_revenue_chart(self, gym_id: uuid.UUID, days: int = 30) -> RevenueChart:
        since = datetime.combine(date.today() - timedelta(days=days - 1), datetime.min.time(), tzinfo=timezone.utc)
        result = await self.db.execute(
            select(Payment).where(
                Payment.gym_id == gym_id,
                Payment.status == "paid",
                Payment.paid_at >= since,
            ).order_by(Payment.paid_at.asc())
        )
        payments = result.scalars().all()

        daily = {}
        for i in range(days):
            day = date.today() - timedelta(days=days - 1 - i)
            daily[day.isoformat()] = 0.0

        for p in payments:
            if p.paid_at:
                key = p.paid_at.date().isoformat()
                daily[key] = daily.get(key, 0) + float(p.amount)

        return RevenueChart(labels=list(daily.keys()), data=list(daily.values()))

    async def get_attendance_chart(self, gym_id: uuid.UUID, days: int = 7) -> dict:
        since = datetime.combine(date.today() - timedelta(days=days - 1), datetime.min.time(), tzinfo=timezone.utc)
        result = await self.db.execute(
            select(AttendanceLog)
            .join(Member)
            .where(Member.gym_id == gym_id, AttendanceLog.check_in >= since)
        )
        logs = result.scalars().all()

        daily = {}
        for i in range(days):
            day = date.today() - timedelta(days=days - 1 - i)
            daily[day.isoformat()] = 0

        for log in logs:
            key = log.check_in.date().isoformat()
            daily[key] = daily.get(key, 0) + 1

        return {"labels": list(daily.keys()), "data": list(daily.values())}

    async def get_expiring(self, gym_id: uuid.UUID) -> list[dict]:
        three_days = date.today() + timedelta(days=3)
        result = await self.db.execute(
            select(MemberMembership)
            .join(Member)
            .where(
                Member.gym_id == gym_id,
                MemberMembership.status == "active",
                MemberMembership.end_date <= three_days,
                MemberMembership.end_date >= date.today(),
            )
        )
        memberships = result.scalars().all()
        return [
            {
                "membership_id": str(m.id),
                "member_id": str(m.member_id),
                "plan_id": str(m.plan_id),
                "end_date": m.end_date.isoformat(),
                "status": m.status,
            }
            for m in memberships
        ]
