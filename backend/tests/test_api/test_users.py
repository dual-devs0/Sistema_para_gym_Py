import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_users_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_user_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401
