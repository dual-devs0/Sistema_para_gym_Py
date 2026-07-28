import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_settings_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/gym/settings")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_settings_unauthorized(client: AsyncClient):
    response = await client.put("/api/v1/gym/settings", json={"name": "New Name"})
    assert response.status_code == 401
