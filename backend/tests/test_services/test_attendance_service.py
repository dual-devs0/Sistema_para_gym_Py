import uuid

import pytest

from app.core.exceptions import AppException, NotFoundException
from app.models.member import Member
from app.services.attendance_service import AttendanceService


@pytest.mark.asyncio
async def test_check_in_member_not_found(db_session):
    service = AttendanceService(db_session)
    with pytest.raises(NotFoundException):
        await service.check_in(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_check_in_double_checkin(db_session):
    member = Member(gym_id=uuid.uuid4(), first_name="Test", last_name="Test")
    db_session.add(member)
    await db_session.flush()

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
async def test_check_in_and_out(db_session):
    gym_id = uuid.uuid4()
    member = Member(gym_id=gym_id, first_name="Test", last_name="User")
    db_session.add(member)
    await db_session.flush()

    service = AttendanceService(db_session)
    log = await service.check_in(member.id, gym_id)
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
async def test_get_today_summary(db_session):
    gym_id = uuid.uuid4()
    member = Member(gym_id=gym_id, first_name="Test", last_name="User")
    db_session.add(member)
    await db_session.flush()

    service = AttendanceService(db_session)
    summary = await service.get_today(gym_id)
    assert summary["total_checkins"] == 0
    assert summary["active_now"] == 0
