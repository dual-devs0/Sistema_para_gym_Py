import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_summary_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/summary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_revenue_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/revenue")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_attendance_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/attendance")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_expiring_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/expiring")
    assert response.status_code == 401
