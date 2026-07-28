import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_plans_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/plans")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_plan_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/plans",
        json={"name": "Monthly", "price": 499, "duration_days": 30, "type": "mensual"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_memberships_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/memberships")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_assign_plan_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/memberships/assign/00000000-0000-0000-0000-000000000000",
        json={"plan_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert response.status_code == 401
