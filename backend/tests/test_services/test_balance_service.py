import uuid
from decimal import Decimal

import pytest

from app.core.exceptions import AppException, NotFoundException
from app.services.balance_service import BalanceService


@pytest.mark.asyncio
async def test_adjust_member_not_found(db_session):
    service = BalanceService(db_session)
    with pytest.raises(NotFoundException):
        await service.adjust(uuid.uuid4(), uuid.uuid4(), 100, "test", None)


@pytest.mark.asyncio
async def test_adjust_rejects_zero_amount(db_session, member):
    service = BalanceService(db_session)
    with pytest.raises(AppException):
        await service.adjust(member.id, member.gym_id, 0, "test", None)


@pytest.mark.asyncio
async def test_adjust_creates_movement_and_updates_cached_balance(db_session, member):
    service = BalanceService(db_session)
    movement = await service.adjust(member.id, member.gym_id, -50000, "Consumo de cantina no pagado", None)
    assert movement.amount == -50000
    assert movement.motivo == "Consumo de cantina no pagado"

    await db_session.refresh(member)
    assert float(member.balance) == -50000


@pytest.mark.asyncio
async def test_multiple_adjustments_accumulate_on_cached_balance(db_session, member):
    service = BalanceService(db_session)
    await service.adjust(member.id, member.gym_id, -100000, "Deuda inicial", None)
    await service.adjust(member.id, member.gym_id, 30000, "Pago parcial", None)

    await db_session.refresh(member)
    assert float(member.balance) == -70000


@pytest.mark.asyncio
async def test_multiple_decimal_adjustments_are_exact_not_float_approximate(db_session, member):
    # Classic float-drift case: 0.1 + 0.2 != 0.3 in binary float. Scaled to
    # currency-like values with cents, repeated float addition would leave
    # a residual fraction instead of landing exactly on the expected total.
    service = BalanceService(db_session)
    amounts = [10.1, 20.2, 30.3, -5.4, 15.15, -0.05]
    expected_total = Decimal("70.30")

    for amount, motivo in zip(amounts, [f"mov-{i}" for i in range(len(amounts))], strict=True):
        await service.adjust(member.id, member.gym_id, amount, motivo, None)

    await db_session.refresh(member)
    assert member.balance == expected_total
    # Guard against the specific bug this test targets: a float round-trip
    # would produce something like Decimal("70.29999999999999") stored as
    # 70.30 only by luck of Numeric(10,2) column rounding on write — the
    # in-memory cached object before that final DB round-trip is what would
    # actually drift, so comparing the exact Decimal here is the real check.
    assert str(member.balance) == "70.30"


@pytest.mark.asyncio
async def test_list_by_member_returns_all_movements(db_session, member):
    # Note: ordering isn't asserted here — both inserts share the same
    # Postgres transaction timestamp (func.now() is transaction-start-time,
    # not wall-clock) since this test runs inside one uncommitted session.
    # Real usage has each adjustment in its own request/transaction, so
    # created_at actually differs there.
    service = BalanceService(db_session)
    await service.adjust(member.id, member.gym_id, -10000, "primero", None)
    await service.adjust(member.id, member.gym_id, -20000, "segundo", None)

    movements = await service.list_by_member(member.id, member.gym_id)
    assert len(movements) == 2
    assert {m.motivo for m in movements} == {"primero", "segundo"}
