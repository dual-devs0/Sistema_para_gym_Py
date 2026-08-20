import asyncio
import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.exceptions import AppException, NotFoundException
from app.models.cash_register import CashRegisterShift, CashWithdrawal
from app.repositories.cash_register_repository import CashRegisterShiftRepository, CashWithdrawalRepository
from app.repositories.gym_repository import GymRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.user_repository import UserRepository
from app.schemas.cash_register import CashShiftResponse, CashWithdrawalResponse
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

# Same fire-and-forget-task-keepalive pattern as payment_service._notification_tasks.
_notification_tasks: set[asyncio.Task] = set()

_CASH_METHODS = {"efectivo", "cash"}
_CARD_METHODS = {"tarjeta", "card"}
_TRANSFER_METHODS = {"transferencia", "transfer"}


class CashRegisterService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CashRegisterShiftRepository(db)
        self.withdrawal_repo = CashWithdrawalRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.gym_repo = GymRepository(db)
        self.user_repo = UserRepository(db)

    async def get_current(self, gym_id: uuid.UUID) -> CashShiftResponse | None:
        shift = await self.repo.get_open_shift(gym_id)
        if not shift:
            return None
        return await self._to_response(shift)

    async def open(self, gym_id: uuid.UUID, user_id: uuid.UUID | None, opening_amount: float) -> CashShiftResponse:
        existing = await self.repo.get_open_shift(gym_id)
        if existing:
            raise AppException("Ya hay un turno de caja abierto para este gimnasio", status_code=409)

        shift = CashRegisterShift(
            gym_id=gym_id,
            opened_by_user_id=user_id,
            opening_amount=opening_amount,
            status="open",
        )
        try:
            created = await self.repo.create(shift)
        except IntegrityError:
            # The pre-check above has a real race window: two concurrent
            # requests can both see "no open shift" and both reach this
            # insert. The partial unique index on
            # cashregistershift(gym_id) WHERE status='open' is the actual
            # guarantee — this just turns the loser's raw DB error into the
            # same clean 409 the pre-check raises, instead of a 500.
            await self.db.rollback()
            raise AppException("Ya hay un turno de caja abierto para este gimnasio", status_code=409) from None
        return await self._to_response(created)

    async def add_withdrawal(
        self, gym_id: uuid.UUID, user_id: uuid.UUID | None, amount: float, motivo: str
    ) -> CashWithdrawalResponse:
        shift = await self.repo.get_open_shift(gym_id)
        if not shift:
            raise AppException("No hay un turno de caja abierto", status_code=409)

        withdrawal = CashWithdrawal(
            gym_id=gym_id,
            shift_id=shift.id,
            amount=amount,
            motivo=motivo,
            created_by_user_id=user_id,
        )
        created = await self.withdrawal_repo.create(withdrawal)
        return CashWithdrawalResponse.model_validate(created)

    async def close(self, gym_id: uuid.UUID, user_id: uuid.UUID | None) -> CashShiftResponse:
        shift = await self.repo.get_open_shift(gym_id)
        if not shift:
            raise NotFoundException("No hay un turno de caja abierto")

        payments = await self.payment_repo.list_paid_since(gym_id, shift.opened_at)
        cash_total = card_total = transfer_total = other_total = 0.0
        for p in payments:
            amount = float(p.amount)
            method = p.payment_method
            if method in _CASH_METHODS:
                cash_total += amount
            elif method in _CARD_METHODS:
                card_total += amount
            elif method in _TRANSFER_METHODS:
                transfer_total += amount
            else:
                other_total += amount

        withdrawals_total = await self.withdrawal_repo.sum_by_shift(shift.id)
        expected_cash = float(shift.opening_amount) + cash_total - withdrawals_total

        shift.status = "closed"
        shift.closed_at = datetime.now(UTC)
        shift.closed_by_user_id = user_id
        shift.cash_total = cash_total
        shift.card_total = card_total
        shift.transfer_total = transfer_total
        shift.other_total = other_total
        shift.withdrawals_total = withdrawals_total
        shift.expected_cash = expected_cash
        updated = await self.repo.update(shift)

        await self._dispatch_close_summary(gym_id, updated)
        return await self._to_response(updated)

    async def _dispatch_close_summary(self, gym_id: uuid.UUID, shift: CashRegisterShift) -> None:
        if not settings.whatsapp_enabled:
            return
        gym = await self.gym_repo.get_by_id(gym_id)
        if not gym or not gym.notifications_enabled:
            return
        owner = await self.user_repo.get_first_active_by_role(gym_id, "owner")
        if not owner or not owner.phone:
            return

        # Snapshot plain values before crossing the session boundary — same
        # reason as payment_service._dispatch_payment_confirmation.
        gym_name = gym.name
        owner_phone = owner.phone
        summary = {
            "cash_total": float(shift.cash_total or 0),
            "card_total": float(shift.card_total or 0),
            "transfer_total": float(shift.transfer_total or 0),
            "other_total": float(shift.other_total or 0),
            "withdrawals_total": float(shift.withdrawals_total or 0),
            "expected_cash": float(shift.expected_cash or 0),
        }

        task = asyncio.create_task(_send_close_summary_task(gym_name, owner_phone, summary))
        _notification_tasks.add(task)
        task.add_done_callback(_notification_tasks.discard)

    async def _to_response(self, shift: CashRegisterShift) -> CashShiftResponse:
        withdrawals = await self.withdrawal_repo.list_by_shift(shift.id)
        resp = CashShiftResponse.model_validate(shift)
        resp.withdrawals = [CashWithdrawalResponse.model_validate(w) for w in withdrawals]
        return resp


async def _send_close_summary_task(gym_name: str, owner_phone: str, summary: dict) -> None:
    try:
        async with async_session_factory() as session:
            service = NotificationService(session)
            await service.send_shift_close_summary(gym_name, owner_phone, summary)
            await session.commit()
    except Exception:
        logger.exception("Failed to dispatch shift-close WhatsApp summary")
