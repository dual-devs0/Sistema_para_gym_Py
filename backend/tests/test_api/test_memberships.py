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
async def test_cancel_membership_unauthorized(client: AsyncClient):
    response = await client.put("/api/v1/memberships/00000000-0000-0000-0000-000000000000/cancel")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_renew_membership_unauthorized(client: AsyncClient):
    response = await client.put("/api/v1/memberships/00000000-0000-0000-0000-000000000000/renew")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_plan_invalid_price(client: AsyncClient):
    response = await client.post(
        "/api/v1/plans",
        json={"name": "Free", "price": -1, "duration_days": 30, "type": "mensual"},
    )
    assert response.status_code == 401
