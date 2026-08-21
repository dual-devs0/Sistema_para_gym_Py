import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundException
from app.models.balance import MemberBalanceMovement
from app.repositories.balance_repository import MemberBalanceMovementRepository
from app.repositories.member_repository import MemberRepository
from app.schemas.balance import MemberBalanceMovementResponse


class BalanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = MemberBalanceMovementRepository(db)
        self.member_repo = MemberRepository(db)

    async def adjust(
        self,
        member_id: uuid.UUID,
        gym_id: uuid.UUID,
        amount: float,
        motivo: str,
        user_id: uuid.UUID | None,
    ) -> MemberBalanceMovementResponse:
        member = await self.member_repo.get_by_id(member_id, gym_id)
        if not member:
            raise NotFoundException("Member not found")
        if amount == 0:
            raise AppException("Amount must be non-zero", status_code=422)

        movement = MemberBalanceMovement(
            gym_id=gym_id,
            member_id=member_id,
            amount=amount,
            motivo=motivo,
            created_by_user_id=user_id,
        )
        created = await self.repo.create(movement)

        # Cached balance updated in the same transaction as the ledger entry
        # — both commit together, so the cache can never drift from the
        # source of truth (the movement row) even if a later step fails.
        # Decimal arithmetic throughout: casting to float here would round-trip
        # the DB's exact Numeric value through binary float, which can drift
        # by fractions of a guaraní across repeated adjustments.
        member.balance = member.balance + Decimal(str(amount))
        await self.member_repo.update(member)

        return MemberBalanceMovementResponse.model_validate(created)

    async def list_by_member(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> list[MemberBalanceMovementResponse]:
        movements = await self.repo.list_by_member(member_id, gym_id)
        return [MemberBalanceMovementResponse.model_validate(m) for m in movements]
