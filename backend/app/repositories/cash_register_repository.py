import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cash_register import CashRegisterShift, CashWithdrawal


class CashRegisterShiftRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_open_shift(self, gym_id: uuid.UUID) -> CashRegisterShift | None:
        result = await self.db.execute(
            select(CashRegisterShift).where(
                CashRegisterShift.gym_id == gym_id, CashRegisterShift.status == "open"
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, shift_id: uuid.UUID, gym_id: uuid.UUID) -> CashRegisterShift | None:
        result = await self.db.execute(
            select(CashRegisterShift).where(CashRegisterShift.id == shift_id, CashRegisterShift.gym_id == gym_id)
        )
        return result.scalar_one_or_none()

    async def create(self, shift: CashRegisterShift) -> CashRegisterShift:
        self.db.add(shift)
        await self.db.flush()
        await self.db.refresh(shift)
        return shift

    async def update(self, shift: CashRegisterShift) -> CashRegisterShift:
        await self.db.flush()
        await self.db.refresh(shift)
        return shift


class CashWithdrawalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, withdrawal: CashWithdrawal) -> CashWithdrawal:
        self.db.add(withdrawal)
        await self.db.flush()
        await self.db.refresh(withdrawal)
        return withdrawal

    async def list_by_shift(self, shift_id: uuid.UUID) -> list[CashWithdrawal]:
        result = await self.db.execute(
            select(CashWithdrawal)
            .where(CashWithdrawal.shift_id == shift_id)
            .order_by(CashWithdrawal.created_at.desc())
        )
        return list(result.scalars().all())

    async def sum_by_shift(self, shift_id: uuid.UUID) -> float:
        withdrawals = await self.list_by_shift(shift_id)
        return sum(float(w.amount) for w in withdrawals)
