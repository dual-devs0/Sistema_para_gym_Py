import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundException
from app.models.payment import Invoice, Payment
from app.repositories.member_repository import MemberRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import PaymentResponse
from app.utils.currency import round_cash_pyg


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.repo = PaymentRepository(db)
        self.member_repo = MemberRepository(db)
        self.db = db

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[PaymentResponse]:
        payments = await self.repo.list_by_gym(gym_id)
        return [await self._to_response(p) for p in payments]

    async def list_by_member(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> list[PaymentResponse]:
        payments = await self.repo.list_by_member(member_id, gym_id)
        return [await self._to_response(p) for p in payments]

    async def register(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        amount: float,
        payment_method: str,
        reference: str | None = None,
        notes: str | None = None,
        member_membership_id: uuid.UUID | None = None,
    ) -> PaymentResponse:
        member = await self.member_repo.get_by_id(member_id, gym_id)
        if not member:
            raise NotFoundException("Member not found")

        if payment_method == "cash":
            amount = round_cash_pyg(amount)

        payment = Payment(
            gym_id=gym_id,
            member_id=member_id,
            member_membership_id=member_membership_id,
            amount=amount,
            payment_method=payment_method,
            reference=reference,
            notes=notes,
            status="paid",
            paid_at=datetime.now(UTC),
        )
        created = await self.repo.create(payment)
        await self._generate_invoice_number(created)
        return await self._to_response(created)

    async def refund(self, payment_id: uuid.UUID, gym_id: uuid.UUID) -> PaymentResponse:
        payment = await self.repo.get_by_id(payment_id)
        if not payment or payment.gym_id != gym_id:
            raise NotFoundException("Payment not found")
        if payment.status != "paid":
            raise AppException("Only paid payments can be refunded", status_code=400)
        payment.status = "refunded"
        updated = await self.repo.update(payment)
        return await self._to_response(updated)

    async def get_invoice(self, payment_id: uuid.UUID, gym_id: uuid.UUID) -> Invoice:
        payment = await self.repo.get_by_id(payment_id)
        if not payment or payment.gym_id != gym_id:
            raise NotFoundException("Payment not found")
        invoice = payment.invoice
        if not invoice:
            raise NotFoundException("Invoice not found")
        return invoice

    async def _generate_invoice_number(self, payment: Payment, attempts: int = 5) -> None:
        # invoice_number is unique at the DB level; under concurrent requests
        # two transactions can read the same MAX() and collide on insert.
        # Retry inside a SAVEPOINT so a collision only rolls back the invoice
        # insert, not the payment already created in this same transaction.
        last_error: IntegrityError | None = None
        for _ in range(attempts):
            result = await self.db.execute(select(func.max(Invoice.invoice_number)).select_from(Invoice))
            max_num = result.scalar()
            next_num = 1
            if max_num:
                parts = max_num.rsplit("-", 1)
                if len(parts) == 2:
                    try:
                        next_num = int(parts[1]) + 1
                    except ValueError:
                        next_num = 1
            invoice = Invoice(
                payment_id=payment.id,
                invoice_number=f"INV-{datetime.now().year}-{next_num:05d}",
            )
            try:
                async with self.db.begin_nested():
                    self.db.add(invoice)
                    await self.db.flush()
                await self.db.refresh(invoice)
                return
            except IntegrityError as exc:
                last_error = exc
        raise AppException("Could not generate a unique invoice number, please retry", status_code=409) from last_error

    async def _to_response(self, payment: Payment) -> PaymentResponse:
        resp = PaymentResponse.model_validate(payment)
        if payment.member:
            resp.member_name = f"{payment.member.first_name} {payment.member.last_name}"
        return resp
