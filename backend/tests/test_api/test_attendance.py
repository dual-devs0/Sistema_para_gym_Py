import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_check_in_unauthorized(client: AsyncClient):
    response = await client.post("/api/v1/attendance/check-in?member_id=00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_check_out_unauthorized(client: AsyncClient):
    response = await client.put("/api/v1/attendance/00000000-0000-0000-0000-000000000000/check-out")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_attendance_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/attendance")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_today_summary_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/attendance/today")
    assert response.status_code == 401
