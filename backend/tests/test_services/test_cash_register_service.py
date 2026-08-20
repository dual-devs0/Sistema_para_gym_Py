from unittest.mock import AsyncMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import AppException, NotFoundException
from app.models.cash_register import CashRegisterShift
from app.services.cash_register_service import CashRegisterService
from app.services.payment_service import PaymentService


@pytest.mark.asyncio
async def test_open_creates_shift(db_session, gym_id):
    service = CashRegisterService(db_session)
    shift = await service.open(gym_id, None, 100000)
    assert shift.status == "open"
    assert shift.opening_amount == 100000


@pytest.mark.asyncio
async def test_open_rejects_second_open_shift(db_session, gym_id):
    service = CashRegisterService(db_session)
    await service.open(gym_id, None, 100000)
    with pytest.raises(AppException):
        await service.open(gym_id, None, 50000)


@pytest.mark.asyncio
async def test_withdrawal_requires_open_shift(db_session, gym_id):
    service = CashRegisterService(db_session)
    with pytest.raises(AppException):
        await service.add_withdrawal(gym_id, None, 10000, "Compra de insumos")


@pytest.mark.asyncio
async def test_close_without_open_shift_fails(db_session, gym_id):
    service = CashRegisterService(db_session)
    with pytest.raises(NotFoundException):
        await service.close(gym_id, None)


@pytest.mark.asyncio
async def test_get_current_returns_none_when_no_open_shift(db_session, gym_id):
    service = CashRegisterService(db_session)
    assert await service.get_current(gym_id) is None


@pytest.mark.asyncio
async def test_close_computes_consolidado_from_real_payments_and_withdrawals(db_session, gym_id, member_id):
    cash_service = CashRegisterService(db_session)
    payment_service = PaymentService(db_session)

    await cash_service.open(gym_id, None, 100000)

    await payment_service.register(gym_id, member_id, 150000, "efectivo")
    await payment_service.register(gym_id, member_id, 80000, "tarjeta")
    await payment_service.register(gym_id, member_id, 30000, "transferencia")
    await cash_service.add_withdrawal(gym_id, None, 20000, "Compra de insumos de limpieza")

    closed = await cash_service.close(gym_id, None)

    assert closed.status == "closed"
    assert closed.cash_total == 150000
    assert closed.card_total == 80000
    assert closed.transfer_total == 30000
    assert closed.withdrawals_total == 20000
    # expected_cash = opening_amount + cash_total - withdrawals_total
    assert closed.expected_cash == 100000 + 150000 - 20000
    assert len(closed.withdrawals) == 1


@pytest.mark.asyncio
async def test_open_allowed_again_after_close(db_session, gym_id):
    service = CashRegisterService(db_session)
    await service.open(gym_id, None, 50000)
    await service.close(gym_id, None)
    reopened = await service.open(gym_id, None, 60000)
    assert reopened.status == "open"


@pytest.mark.asyncio
async def test_db_rejects_second_open_shift_row_via_direct_insert(db_session, gym_id):
    # Bypasses the service entirely — proves the guarantee lives in the DB
    # (partial unique index on cashregistershift(gym_id) WHERE status='open'),
    # not just in the service's check-then-insert.
    db_session.add(CashRegisterShift(gym_id=gym_id, opening_amount=100000, status="open"))
    await db_session.flush()

    db_session.add(CashRegisterShift(gym_id=gym_id, opening_amount=50000, status="open"))
    with pytest.raises(IntegrityError):
        await db_session.flush()


@pytest.mark.asyncio
async def test_open_translates_race_lost_at_db_level_into_app_exception(db_session, gym_id):
    # Simulates two concurrent opens racing past the pre-check: force the
    # service's own get_open_shift() to (wrongly) report "no open shift" —
    # exactly what a second request would see if it read before the first
    # request's insert became visible — then confirm the DB-level unique
    # index still blocks the second insert, and the service surfaces that
    # as the same clean AppException instead of a raw IntegrityError/500.
    service = CashRegisterService(db_session)
    await service.open(gym_id, None, 100000)

    service.repo.get_open_shift = AsyncMock(return_value=None)

    with pytest.raises(AppException):
        await service.open(gym_id, None, 50000)
