import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundException
from app.models.member import Member
from app.models.payment import Invoice, Payment
from app.repositories.payment_repository import InvoiceRepository, PaymentRepository
from app.schemas.payment import PaymentResponse


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.repo = PaymentRepository(db)
        self.invoice_repo = InvoiceRepository(db)
        self.db = db

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[PaymentResponse]:
        payments = await self.repo.list_by_gym(gym_id)
        return [await self._to_response(p) for p in payments]

    async def register(
        self, gym_id: uuid.UUID, member_id: uuid.UUID, amount: float, payment_method: str,
        reference: str | None = None, notes: str | None = None,
        member_membership_id: uuid.UUID | None = None,
    ) -> PaymentResponse:
        result = await self.db.execute(
            select(Member).where(Member.id == member_id, Member.gym_id == gym_id)
        )
        if not result.scalar_one_or_none():
            raise NotFoundException("Member", str(member_id))

        payment = Payment(
            gym_id=gym_id,
            member_id=member_id,
            member_membership_id=member_membership_id,
            amount=amount,
            payment_method=payment_method,
            reference=reference,
            notes=notes,
            status="paid",
            paid_at=datetime.now(timezone.utc),
        )
        created = await self.repo.create(payment)
        await self._generate_invoice_number(created)
        return await self._to_response(created)

    async def refund(self, payment_id: uuid.UUID, gym_id: uuid.UUID) -> PaymentResponse:
        payment = await self.repo.get_by_id(payment_id)
        if not payment or payment.gym_id != gym_id:
            raise NotFoundException("Payment", str(payment_id))
        if payment.status != "paid":
            raise AppException("Only paid payments can be refunded", status_code=400)
        payment.status = "refunded"
        updated = await self.repo.update(payment)
        return await self._to_response(updated)

    async def get_invoice(self, payment_id: uuid.UUID, gym_id: uuid.UUID) -> Invoice:
        payment = await self.repo.get_by_id(payment_id)
        if not payment or payment.gym_id != gym_id:
            raise NotFoundException("Payment", str(payment_id))
        invoice = payment.invoice
        if not invoice:
            raise NotFoundException("Invoice", str(payment_id))
        return invoice

    async def _generate_invoice_number(self, payment: Payment) -> None:
        count = await self.db.execute(select(func.count()).select_from(Invoice))
        total = count.scalar() or 0
        invoice = Invoice(
            payment_id=payment.id,
            invoice_number=f"INV-{datetime.now().year}-{total + 1:05d}",
        )
        await self.invoice_repo.create(invoice)

    async def _to_response(self, payment: Payment) -> PaymentResponse:
        resp = PaymentResponse.model_validate(payment)
        if payment.member:
            resp.member_name = f"{payment.member.first_name} {payment.member.last_name}"
        return resp
