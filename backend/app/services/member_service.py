import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.member import Member
from app.repositories.member_repository import MemberRepository

ALLOWED_MEMBER_FIELDS = {"first_name", "last_name", "email", "phone", "document_number", "birth_date", "gender", "photo_url", "notes", "status"}


class MemberService:
    def __init__(self, db: AsyncSession):
        self.repo = MemberRepository(db)

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[Member]:
        return await self.repo.list_by_gym(gym_id)

    async def get_by_id(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> Member:
        member = await self.repo.get_by_id(member_id, gym_id)
        if not member:
            raise NotFoundException("Member not found")
        return member

    async def create(self, gym_id: uuid.UUID, data: dict) -> Member:
        member = Member(gym_id=gym_id, **{k: v for k, v in data.items() if k in ALLOWED_MEMBER_FIELDS and v is not None})
        return await self.repo.create(member)

    async def update(self, member_id: uuid.UUID, gym_id: uuid.UUID, data: dict) -> Member:
        member = await self.get_by_id(member_id, gym_id)
        for key in data:
            if key in ALLOWED_MEMBER_FIELDS and data[key] is not None:
                setattr(member, key, data[key])
        return await self.repo.update(member)

    async def delete(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> None:
        member = await self.get_by_id(member_id, gym_id)
        await self.repo.soft_delete(member)
