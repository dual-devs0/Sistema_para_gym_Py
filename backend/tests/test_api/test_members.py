import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_members_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/members")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_member_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/members/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_member_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/members",
        json={"first_name": "Juan", "last_name": "Pérez"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_member_unauthorized(client: AsyncClient):
    response = await client.put(
        "/api/v1/members/00000000-0000-0000-0000-000000000000",
        json={"first_name": "New"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_member_unauthorized(client: AsyncClient):
    response = await client.delete("/api/v1/members/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_member_attendance_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/members/00000000-0000-0000-0000-000000000000/attendance")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_member_payments_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/members/00000000-0000-0000-0000-000000000000/payments")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_member_memberships_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/members/00000000-0000-0000-0000-000000000000/memberships")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_assign_membership_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/members/00000000-0000-0000-0000-000000000000/memberships",
        json={"plan_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert response.status_code == 401
