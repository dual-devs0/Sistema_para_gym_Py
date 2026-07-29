import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_invalid_email(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={"email": "none@test.com", "password": "123456"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout_without_auth(client: AsyncClient):
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient):
    response = await client.post("/api/v1/auth/forgot-password", json={"email": "none@test.com"})
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    response = await client.post("/api/v1/auth/reset-password", json={"token": "bad", "password": "NewPass123!"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_disabled(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "owner@test.com", "password": "SecurePass1", "full_name": "Owner"},
    )
    assert response.status_code == 403
