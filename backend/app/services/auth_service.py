import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, ForbiddenException, UnauthorizedException
from app.core.redis import get_redis
from app.core.security import (
    TOKEN_TYPE_ACCESS,
    TOKEN_TYPE_PASSWORD_RESET,
    TOKEN_TYPE_REFRESH,
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def login(self, email: str, password: str) -> tuple[str, str, User, str | None]:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")
        if not user.is_active:
            raise ForbiddenException("Account is inactive")

        previous_login = user.last_login.isoformat() if user.last_login else None

        access_token = create_access_token(str(user.id), str(user.gym_id))
        refresh_token, jti, expires_at = create_refresh_token(str(user.id))

        redis = await get_redis()
        await redis.setex(f"refresh:{jti}", int((expires_at - datetime.now(timezone.utc)).total_seconds()), str(user.id))

        user.last_login = datetime.now(timezone.utc)
        await self.repo.update(user)

        return access_token, refresh_token, user, previous_login

    async def refresh(self, refresh_token: str) -> tuple[str, str]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("error"):
            raise UnauthorizedException("Invalid or expired refresh token")
        if payload.get("type") != TOKEN_TYPE_REFRESH:
            raise UnauthorizedException("Invalid token type")

        jti = payload.get("jti")
        sub = payload.get("sub")
        if not jti or not sub:
            raise UnauthorizedException("Invalid refresh token")

        redis = await get_redis()
        stored = await redis.getdel(f"refresh:{jti}")
        if not stored:
            await redis.setex(f"token:blacklist:{jti}", 86400, "reused")
            raise UnauthorizedException("Refresh token has been revoked or reused")

        user = await self.repo.get_by_id(uuid.UUID(sub))
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        access_token = create_access_token(str(user.id), str(user.gym_id))
        new_refresh_token, new_jti, expires_at = create_refresh_token(str(user.id))
        await redis.setex(f"refresh:{new_jti}", int((expires_at - datetime.now(timezone.utc)).total_seconds()), str(user.id))

        return access_token, new_refresh_token

    async def logout(self, access_token: str) -> None:
        payload = decode_token(access_token)
        jti = payload.get("jti")
        if jti:
            redis = await get_redis()
            await redis.setex(f"token:blacklist:{jti}", 900, "revoked")

    async def register_owner(self, email: str, password: str, full_name: str, gym_id: uuid.UUID) -> User:
        existing = await self.repo.get_by_email(email)
        if existing:
            raise ConflictException("Email already registered")
        user = User(
            gym_id=gym_id,
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role="owner",
            password_changed_at=datetime.now(timezone.utc),
        )
        return await self.repo.create(user)

    async def forgot_password(self, email: str) -> None:
        user = await self.repo.get_by_email(email)
        if not user:
            return
        token, jti, expires_at = create_password_reset_token(str(user.id))
        redis = await get_redis()
        await redis.setex(f"password_reset:{jti}", int((expires_at - datetime.now(timezone.utc)).total_seconds()), str(user.id))

    async def reset_password(self, token: str, new_password: str) -> None:
        payload = decode_token(token)
        if not payload or payload.get("error"):
            raise UnauthorizedException("Invalid or expired reset token")
        if payload.get("type") != TOKEN_TYPE_PASSWORD_RESET:
            raise UnauthorizedException("Invalid token type")

        jti = payload.get("jti")
        user_id = payload.get("sub")
        if not jti or not user_id:
            raise UnauthorizedException("Invalid reset token")

        redis = await get_redis()
        stored = await redis.getdel(f"password_reset:{jti}")
        if not stored:
            raise UnauthorizedException("Reset token has expired or already been used")

        user = await self.repo.get_by_id(uuid.UUID(user_id))
        if not user:
            raise UnauthorizedException("User not found")

        user.password_hash = hash_password(new_password)
        user.password_changed_at = datetime.now(timezone.utc)
        await self.repo.update(user)
