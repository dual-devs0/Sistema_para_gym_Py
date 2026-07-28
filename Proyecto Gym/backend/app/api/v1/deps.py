import uuid

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.models.user import User


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
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


async def get_current_gym_id(current_user: User = Depends(get_current_user)) -> uuid.UUID:
    return current_user.gym_id
