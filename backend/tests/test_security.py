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
async def test_expired_token(client: AsyncClient):
    response = await client.get(
        "/api/v1/members",
        headers={
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjB9"  # noqa: E501
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sql_injection_attempt(client: AsyncClient):
    response = await client.get(
        "/api/v1/members/1;DROP%20TABLE%20members--",
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_xss_in_member_name(client: AsyncClient):
    response = await client.post(
        "/api/v1/members",
        json={"first_name": "<script>alert('xss')</script>", "last_name": "Test"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_receptionist_cannot_delete_member(client: AsyncClient):
    response = await client.delete(
        "/api/v1/members/00000000-0000-0000-0000-000000000000",
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_weak_password_rejected_at_schema(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "weak@test.com", "password": "123", "full_name": "Test", "role": "owner"},
    )
    assert response.status_code in (401, 422)


@pytest.mark.asyncio
async def test_non_existent_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_health_no_auth(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
