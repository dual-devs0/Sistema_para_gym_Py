import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import (
    create_access_token,
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

    async def login(self, email: str, password: str) -> tuple[str, str, User]:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")
        access_token = create_access_token(str(user.id), str(user.gym_id))
        refresh_token = create_refresh_token(str(user.id))
        return access_token, refresh_token, user

    async def refresh(self, refresh_token: str) -> tuple[str, str]:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid refresh token")
        user = await self.repo.get_by_id(uuid.UUID(user_id))
        if not user:
            raise UnauthorizedException("User not found")
        access_token = create_access_token(str(user.id), str(user.gym_id))
        new_refresh_token = create_refresh_token(str(user.id))
        return access_token, new_refresh_token

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
        )
        return await self.repo.create(user)

    async def forgot_password(self, email: str) -> str | None:
        user = await self.repo.get_by_email(email)
        if not user:
            return None
        token = create_access_token(str(user.id), str(user.gym_id))
        return token

    async def reset_password(self, token: str, new_password: str) -> None:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id or payload.get("type") != "access":
            raise UnauthorizedException("Invalid or expired reset token")
        user = await self.repo.get_by_id(uuid.UUID(user_id))
        if not user:
            raise UnauthorizedException("User not found")
        user.password_hash = hash_password(new_password)
        await self.repo.update(user)
