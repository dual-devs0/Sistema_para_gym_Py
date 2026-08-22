import uuid
from datetime import UTC, date, datetime, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.payment import Invoice, Payment
from app.models.product import PaymentItem


class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _base_options():
        return (
            selectinload(Payment.member),
            selectinload(Payment.sifen_document),
            selectinload(Payment.items).selectinload(PaymentItem.product),
        )

    async def get_by_id(self, payment_id: uuid.UUID) -> Payment | None:
        result = await self.db.execute(
            select(Payment).where(Payment.id == payment_id).options(*self._base_options())
        )
        return result.scalar_one_or_none()

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[Payment]:
        result = await self.db.execute(
            select(Payment)
            .where(Payment.gym_id == gym_id)
            .options(*self._base_options())
            .order_by(Payment.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_revenue_today(self, gym_id: uuid.UUID) -> float:
        today_start = datetime.combine(date.today(), time.min, tzinfo=UTC)
        result = await self.db.execute(
            select(Payment).where(
                Payment.gym_id == gym_id,
                Payment.status == "paid",
                Payment.paid_at >= today_start,
            )
        )
        payments = result.scalars().all()
        return sum(float(p.amount) for p in payments)

    async def get_revenue_month(self, gym_id: uuid.UUID) -> float:
        today = date.today()
        month_start = datetime.combine(today.replace(day=1), time.min, tzinfo=UTC)
        result = await self.db.execute(
            select(Payment).where(
                Payment.gym_id == gym_id,
                Payment.status == "paid",
                Payment.paid_at >= month_start,
            )
        )
        payments = result.scalars().all()
        return sum(float(p.amount) for p in payments)

    async def list_by_member(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> list[Payment]:
        result = await self.db.execute(
            select(Payment)
            .where(Payment.member_id == member_id, Payment.gym_id == gym_id)
            .options(*self._base_options())
            .order_by(Payment.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_all(self) -> int:
        from sqlalchemy import func

        result = await self.db.execute(select(func.count()).select_from(Payment))
        return result.scalar() or 0

    async def list_paid_since(self, gym_id: uuid.UUID, since: datetime) -> list[Payment]:
        result = await self.db.execute(
            select(Payment)
            .where(
                Payment.gym_id == gym_id,
                Payment.status == "paid",
                Payment.paid_at >= since,
            )
            .order_by(Payment.paid_at.asc())
        )
        return list(result.scalars().all())

    async def create(self, payment: Payment) -> Payment:
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        return payment

    async def update(self, payment: Payment) -> Payment:
        await self.db.flush()
        await self.db.refresh(payment)
        return payment


class InvoiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice
