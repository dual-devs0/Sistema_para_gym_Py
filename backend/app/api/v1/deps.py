import uuid

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.permissions import require_permission as _require_permission
from app.core.redis import get_redis
from app.core.security import decode_token, TOKEN_TYPE_ACCESS
from app.models.user import User


async def _check_token_blacklist(jti: str) -> None:
    redis = await get_redis()
    if redis is None:
        return
    blacklisted = await redis.get(f"token:blacklist:{jti}")
    if blacklisted:
        raise UnauthorizedException("Token has been revoked")


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    error = payload.get("error")
    if error == "expired":
        raise UnauthorizedException("Token expired")
    if not payload:
        raise UnauthorizedException("Invalid token")
    if payload.get("type") != TOKEN_TYPE_ACCESS:
        raise UnauthorizedException("Invalid token type")

    jti = payload.get("jti")
    if jti:
        await _check_token_blacklist(jti)

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id), User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    return user


def require_role(*roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenException(f"Role '{current_user.role}' not allowed. Requires: {', '.join(roles)}")
        return current_user
    return role_checker


def require_permission(*permissions: str):
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        _require_permission(*permissions)(current_user)
        return current_user
    return permission_checker


def require_platform_staff():
    async def platform_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.is_platform_staff:
            raise ForbiddenException("This endpoint requires a platform staff account")
        return current_user
    return platform_checker


async def get_current_gym_id(current_user: User = Depends(get_current_user)) -> uuid.UUID:
    if current_user.gym_id is None:
        raise ForbiddenException("Platform staff cannot access gym-scoped endpoints")
    return current_user.gym_id
