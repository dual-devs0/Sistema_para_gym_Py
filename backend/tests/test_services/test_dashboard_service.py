import uuid

import pytest

from app.services.dashboard_service import DashboardService


@pytest.mark.asyncio
async def test_summary_empty_gym(db_session):
    service = DashboardService(db_session)
    summary = await service.get_summary(uuid.uuid4())
    assert summary["revenue_today"] == 0
    assert summary["revenue_month"] == 0
    assert summary["active_members"] == 0
    assert summary["new_members_month"] == 0
    assert summary["checkins_today"] == 0
    assert summary["members_expiring_soon"] == 0


@pytest.mark.asyncio
async def test_summary_with_active_member(db_session, gym_id, member_id):
    service = DashboardService(db_session)
    summary = await service.get_summary(gym_id)
    assert summary["active_members"] == 1


@pytest.mark.asyncio
async def test_revenue_chart_empty(db_session):
    service = DashboardService(db_session)
    chart = await service.get_revenue_chart(uuid.uuid4(), days=7)
    assert len(chart["labels"]) == 7
    assert all(v == 0 for v in chart["data"])


@pytest.mark.asyncio
async def test_attendance_chart_empty(db_session):
    service = DashboardService(db_session)
    result = await service.get_attendance_chart(uuid.uuid4(), days=7)
    assert len(result["labels"]) == 7
    assert all(v == 0 for v in result["data"])


@pytest.mark.asyncio
async def test_expiring_empty(db_session):
    service = DashboardService(db_session)
    result = await service.get_expiring(uuid.uuid4())
    assert result == []
