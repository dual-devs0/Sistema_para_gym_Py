import uuid

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
