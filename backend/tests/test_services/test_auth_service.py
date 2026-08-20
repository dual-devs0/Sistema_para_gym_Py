import pytest

from app.core.exceptions import ConflictException, UnauthorizedException
from app.services.auth_service import AuthService


@pytest.mark.asyncio
async def test_register_owner_creates_user(db_session, gym_id):
    service = AuthService(db_session)
    user = await service.register_owner("owner@test.com", "pass123", "Owner", gym_id)
    assert user.email == "owner@test.com"
    assert user.role == "owner"
    assert user.gym_id == gym_id


@pytest.mark.asyncio
async def test_register_owner_duplicate_email(db_session, gym_id):
    service = AuthService(db_session)
    await service.register_owner("dup@test.com", "pass123", "Dup", gym_id)
    with pytest.raises(ConflictException):
        await service.register_owner("dup@test.com", "other", "Dup2", gym_id)


@pytest.mark.asyncio
async def test_login_invalid_credentials(db_session):
    service = AuthService(db_session)
    with pytest.raises(UnauthorizedException):
        await service.login("noone@test.com", "wrong")


@pytest.mark.asyncio
async def test_refresh_invalid_token(db_session):
    service = AuthService(db_session)
    with pytest.raises(UnauthorizedException):
        await service.refresh("invalidtoken")


@pytest.mark.asyncio
async def test_forgot_password_unknown_email_does_not_raise(db_session):
    service = AuthService(db_session)
    await service.forgot_password("unknown@test.com")


@pytest.mark.asyncio
async def test_reset_password_invalid_token(db_session):
    service = AuthService(db_session)
    with pytest.raises(UnauthorizedException):
        await service.reset_password("badtoken", "NewPass123!")
