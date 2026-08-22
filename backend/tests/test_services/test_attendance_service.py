import uuid

import pytest

from app.core.exceptions import AppException, NotFoundException
from app.services.attendance_service import AttendanceService
from app.services.balance_service import BalanceService
from app.services.gym_service import GymService


@pytest.mark.asyncio
async def test_check_in_member_not_found(db_session):
    service = AttendanceService(db_session)
    with pytest.raises(NotFoundException):
        await service.check_in(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_check_in_double_checkin(db_session, member):
    service = AttendanceService(db_session)
    await service.check_in(member.id, member.gym_id)
    with pytest.raises(AppException):
        await service.check_in(member.id, member.gym_id)


@pytest.mark.asyncio
async def test_check_out_not_found(db_session):
    service = AttendanceService(db_session)
    with pytest.raises(NotFoundException):
        await service.check_out(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_check_in_and_out(db_session, gym_id, member_id):
    service = AttendanceService(db_session)
    log = await service.check_in(member_id, gym_id)
    assert log.check_in is not None
    assert log.check_out is None

    checked_out = await service.check_out(uuid.UUID(log.id), gym_id)
    assert checked_out.check_out is not None


@pytest.mark.asyncio
async def test_list_attendance_empty(db_session):
    service = AttendanceService(db_session)
    logs = await service.list_attendance(uuid.uuid4())
    assert logs == []


@pytest.mark.asyncio
async def test_get_today_summary(db_session, gym_id, member_id):
    service = AttendanceService(db_session)
    summary = await service.get_today(gym_id)
    assert summary["total_checkins"] == 0
    assert summary["active_now"] == 0


@pytest.mark.asyncio
async def test_check_in_blocked_when_debt_exceeds_limit(db_session, gym_id, member):
    await GymService(db_session).update_settings(gym_id, {"debt_limit": 100000})
    await BalanceService(db_session).adjust(member.id, gym_id, -150000, "Deuda de prueba", None)

    service = AttendanceService(db_session)
    with pytest.raises(AppException) as exc_info:
        await service.check_in(member.id, gym_id)
    assert "150.000" in str(exc_info.value.detail)
    assert "100.000" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_check_in_allowed_when_debt_within_limit(db_session, gym_id, member):
    await GymService(db_session).update_settings(gym_id, {"debt_limit": 100000})
    await BalanceService(db_session).adjust(member.id, gym_id, -50000, "Deuda menor al limite", None)

    service = AttendanceService(db_session)
    log = await service.check_in(member.id, gym_id)
    assert log.check_in is not None


@pytest.mark.asyncio
async def test_check_in_allowed_when_no_debt_limit_configured(db_session, gym_id, member):
    # debt_limit defaults to NULL — feature off until an owner sets it.
    await BalanceService(db_session).adjust(member.id, gym_id, -999999, "Deuda enorme sin limite configurado", None)

    service = AttendanceService(db_session)
    log = await service.check_in(member.id, gym_id)
    assert log.check_in is not None


@pytest.mark.asyncio
async def test_check_in_allowed_when_balance_positive(db_session, gym_id, member):
    await GymService(db_session).update_settings(gym_id, {"debt_limit": 100000})
    await BalanceService(db_session).adjust(member.id, gym_id, 50000, "Saldo a favor", None)

    service = AttendanceService(db_session)
    log = await service.check_in(member.id, gym_id)
    assert log.check_in is not None
