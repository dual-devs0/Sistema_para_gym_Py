import asyncio
import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.exceptions import AppException, NotFoundException
from app.models.member import Member
from app.models.payment import Invoice, Payment
from app.models.product import PaymentItem
from app.repositories.member_repository import MemberRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.payment import PaymentItemRequest, PaymentResponse
from app.services.invoicing_service import InvoicingService
from app.services.notification_service import NotificationService
from app.utils.currency import round_cash_pyg

logger = logging.getLogger(__name__)

# Fire-and-forget WhatsApp dispatch tasks, kept alive here so the event loop
# doesn't garbage-collect them mid-flight (standard asyncio.create_task gotcha).
_notification_tasks: set[asyncio.Task] = set()


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.repo = PaymentRepository(db)
        self.member_repo = MemberRepository(db)
        self.product_repo = ProductRepository(db)
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
        items: list[PaymentItemRequest] | None = None,
    ) -> PaymentResponse:
        member = await self.member_repo.get_by_id(member_id, gym_id)
        if not member:
            raise NotFoundException("Member not found")

        # Resolve cantina items BEFORE creating the payment: price is
        # snapshotted from the product (never trusted from the client), and
        # stock is decremented atomically per item — if any item is out of
        # stock, abort before anything is written.
        resolved_items: list[dict] = []
        items_subtotal = 0.0
        for item in items or []:
            product_id = uuid.UUID(item.product_id)
            product = await self.product_repo.get_by_id(product_id, gym_id)
            if not product or not product.is_active:
                raise NotFoundException("Product not found")
            ok = await self.product_repo.decrement_stock(product_id, item.quantity)
            if not ok:
                raise AppException(f"Stock insuficiente de {product.name}", status_code=409)
            unit_price = float(product.price)
            subtotal = unit_price * item.quantity
            items_subtotal += subtotal
            resolved_items.append(
                {"product_id": product_id, "quantity": item.quantity, "unit_price": unit_price, "subtotal": subtotal}
            )

        total_amount = amount + items_subtotal
        if total_amount <= 0:
            raise AppException("El monto total del pago debe ser mayor a cero", status_code=422)

        if payment_method == "cash":
            total_amount = round_cash_pyg(total_amount)

        payment = Payment(
            gym_id=gym_id,
            member_id=member_id,
            member_membership_id=member_membership_id,
            amount=total_amount,
            payment_method=payment_method,
            reference=reference,
            notes=notes,
            status="paid",
            paid_at=datetime.now(UTC),
        )
        created = await self.repo.create(payment)

        payment_items = [
            PaymentItem(
                payment_id=created.id,
                product_id=ri["product_id"],
                quantity=ri["quantity"],
                unit_price=ri["unit_price"],
                subtotal=ri["subtotal"],
            )
            for ri in resolved_items
        ]
        for pi in payment_items:
            self.db.add(pi)
        await self.db.flush()
        # Always refresh the relationship (even with zero items) instead of
        # assigning `created.items` directly: SQLAlchemy's collection setter
        # loads the *old* value first to diff against the new one, which is
        # a lazy load and crashes on an AsyncSession (MissingGreenlet) since
        # `items` was never eager-loaded on this freshly-created instance.
        await self.db.refresh(created, attribute_names=["items"])

        await self._generate_invoice_number(created)
        sifen_document = await self._generate_sifen_document(gym_id, created.id)
        if sifen_document:
            # Set the in-memory relationship directly instead of letting
            # `_to_response` below lazy-load `created.sifen_document` — that
            # relationship isn't selectinload'd on this freshly-created
            # instance and a lazy load would fail on an AsyncSession anyway.
            created.sifen_document = sifen_document
        self._dispatch_payment_confirmation(gym_id, member, created)
        return await self._to_response(created)

    async def _generate_sifen_document(self, gym_id: uuid.UUID, payment_id: uuid.UUID):
        # In Sub-entrega 3a this is cheap (two SELECTs + an INSERT into
        # pending_stamping, no network I/O — every gym is fiscally "not
        # ready" until Sub-entrega 3b adds certificate handling) so it runs
        # inline on the same session/transaction as the payment, same as
        # `_generate_invoice_number` above. Once 3b wires real SIFEN
        # transmission (a slow network call), this needs to become
        # fire-and-forget like `_dispatch_payment_confirmation` below —
        # a real payment must never block on SIFEN being slow or down.
        try:
            return await InvoicingService(self.db).generate_for_payment(gym_id, payment_id)
        except Exception:
            logger.exception("Failed to create SIFEN document for payment %s", payment_id)
            return None

    def _dispatch_payment_confirmation(self, gym_id: uuid.UUID, member: Member, payment: Payment) -> None:
        if not settings.whatsapp_enabled:
            # No credentials configured: skip entirely, don't even touch the
            # DB. The background task's session comes from the app-wide
            # async_session_factory (real DATABASE_URL), not whatever session
            # a test overrides via FastAPI dependency_overrides — dispatching
            # unconditionally would leak writes into the wrong database
            # whenever this runs under tests or a differently-configured env.
            return

        # Snapshot plain values now, while `member`/`payment` are still
        # attached to this request's session — the background task uses its
        # own session and must never touch these ORM instances directly.
        member_id = member.id
        member_name = f"{member.first_name} {member.last_name}"
        member_phone = member.phone
        amount = float(payment.amount)
        paid_at = payment.paid_at
        member_membership_id = payment.member_membership_id

        task = asyncio.create_task(
            _send_payment_confirmation_task(
                gym_id, member_id, member_name, member_phone, amount, paid_at, member_membership_id
            )
        )
        _notification_tasks.add(task)
        task.add_done_callback(_notification_tasks.discard)

    async def refund(self, payment_id: uuid.UUID, gym_id: uuid.UUID) -> PaymentResponse:
        payment = await self.repo.get_by_id(payment_id)
        if not payment or payment.gym_id != gym_id:
            raise NotFoundException("Payment not found")
        if payment.status != "paid":
            raise AppException("Only paid payments can be refunded", status_code=400)
        # repo.update()'s db.refresh() expires relationship attributes.
        # `member` survives via SQLAlchemy's many-to-one identity-map
        # shortcut, but `sifen_document` is a one-to-one keyed by the
        # *other* table's FK and can't use that shortcut — it would trigger
        # a real lazy load in _to_response below, which crashes on an
        # AsyncSession. Snapshot it now, reattach after refresh.
        sifen_document = payment.sifen_document
        payment.status = "refunded"
        updated = await self.repo.update(payment)
        if sifen_document:
            updated.sifen_document = sifen_document
        # `items` is a one-to-many collection — same expiry problem as
        # sifen_document, but reassigning a collection (unlike a scalar
        # relationship) forces SQLAlchemy to diff against the old value
        # first, which is itself a lazy load. Refresh it directly instead.
        await self.db.refresh(updated, attribute_names=["items"])
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
        if payment.sifen_document:
            resp.sifen_status = payment.sifen_document.status
        for i, item in enumerate(payment.items or []):
            if item.product:
                resp.items[i].product_name = item.product.name
        return resp


async def _send_payment_confirmation_task(
    gym_id: uuid.UUID,
    member_id: uuid.UUID,
    member_name: str,
    member_phone: str | None,
    amount: float,
    paid_at: datetime | None,
    member_membership_id: uuid.UUID | None,
) -> None:
    # Runs detached from the request lifecycle: opens its own DB session so
    # it survives after the request's session is closed by FastAPI teardown.
    try:
        async with async_session_factory() as session:
            service = NotificationService(session)
            await service.send_payment_confirmation(
                gym_id, member_id, member_name, member_phone, amount, paid_at, member_membership_id
            )
            await session.commit()
    except Exception:
        logger.exception("Failed to dispatch payment confirmation WhatsApp notification")
