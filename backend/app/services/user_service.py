import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository

ALLOWED_USER_FIELDS = {"full_name", "phone"}


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[User]:
        return await self.repo.list_by_gym(gym_id)

    async def get_by_id(self, user_id: uuid.UUID, gym_id: uuid.UUID) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user or user.gym_id != gym_id:
            raise NotFoundException("User not found")
        return user

    async def create(self, email: str, password: str, full_name: str, role: str, gym_id: uuid.UUID) -> User:
        existing = await self.repo.get_by_email(email)
        if existing:
            raise ConflictException("Email already registered")
        user = User(
            gym_id=gym_id,
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=role,
        )
        return await self.repo.create(user)

    async def invite(self, email: str, full_name: str, role: str, gym_id: uuid.UUID) -> tuple[User, str]:
        existing = await self.repo.get_by_email(email)
        if existing:
            raise ConflictException("Email already registered")
        import secrets

        temp_password = secrets.token_urlsafe(12)
        user = User(
            gym_id=gym_id,
            email=email,
            password_hash=hash_password(temp_password),
            full_name=full_name,
            role=role,
            is_active=True,
        )
        created = await self.repo.create(user)
        return created, temp_password

    async def update(self, user_id: uuid.UUID, gym_id: uuid.UUID, data: dict) -> User:
        user = await self.get_by_id(user_id, gym_id)
        for key in data:
            if key in ALLOWED_USER_FIELDS and data[key] is not None:
                setattr(user, key, data[key])
        return await self.repo.update(user)

    async def delete(self, user_id: uuid.UUID, gym_id: uuid.UUID) -> None:
        user = await self.get_by_id(user_id, gym_id)
        await self.repo.soft_delete(user)
