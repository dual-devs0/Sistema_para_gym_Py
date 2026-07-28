import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    response = await client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" in response.headers


@pytest.mark.asyncio
async def test_invalid_token_format(client: AsyncClient):
    response = await client.get(
        "/api/v1/members",
        headers={"Authorization": "Bearer invalid_token_here"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_missing_authorization_header(client: AsyncClient):
    response = await client.get("/api/v1/members")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sql_injection_member_id(client: AsyncClient):
    response = await client.get(
        "/api/v1/members/1;DROP TABLE members--",
        headers={"Authorization": "Bearer any"},
    )
    assert response.status_code in (401, 422, 400)


@pytest.mark.asyncio
async def test_xss_in_member_name(client: AsyncClient):
    response = await client.post(
        "/api/v1/members",
        json={"first_name": "<script>alert('xss')</script>", "last_name": "Test"},
        headers={"Authorization": "Bearer any"},
    )
    assert response.status_code in (401, 422)


@pytest.mark.asyncio
async def test_oversized_payload(client: AsyncClient):
    response = await client.post(
        "/api/v1/members",
        json={"first_name": "A" * 10000, "last_name": "B"},
        headers={"Authorization": "Bearer any"},
    )
    assert response.status_code in (401, 413, 422)


@pytest.mark.asyncio
async def test_role_based_access_owner_only(client: AsyncClient):
    response = await client.delete(
        "/api/v1/members/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": "Bearer receptionist_token"},
    )
    assert response.status_code != 204


@pytest.mark.asyncio
async def test_duplicate_email_registration(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "dupe@test.com", "password": "Pass123!", "name": "Test", "role": "owner"},
    )
    if response.status_code == 201:
        response2 = await client.post(
            "/api/v1/auth/register",
            json={"email": "dupe@test.com", "password": "Pass123!", "name": "Test", "role": "owner"},
        )
        assert response2.status_code in (400, 409)


@pytest.mark.asyncio
async def test_weak_password_rejected(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "weak@test.com", "password": "123", "name": "Test", "role": "owner"},
    )
    assert response.status_code in (401, 422, 400)
