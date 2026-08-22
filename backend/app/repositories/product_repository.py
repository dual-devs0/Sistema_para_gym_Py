import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: uuid.UUID, gym_id: uuid.UUID) -> Product | None:
        result = await self.db.execute(
            select(Product).where(Product.id == product_id, Product.gym_id == gym_id)
        )
        return result.scalar_one_or_none()

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[Product]:
        result = await self.db.execute(
            select(Product).where(Product.gym_id == gym_id).order_by(Product.name.asc())
        )
        return list(result.scalars().all())

    async def create(self, product: Product) -> Product:
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def update(self, product: Product) -> Product:
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def decrement_stock(self, product_id: uuid.UUID, quantity: int) -> bool:
        """Atomic, race-safe decrement: only succeeds if stock >= quantity at
        the DB level (same guarded-UPDATE pattern as remaining_visits in
        attendance_service.check_in()). Returns False (no row touched) if
        stock is insufficient — caller must abort, never let stock go negative."""
        stmt = (
            update(Product)
            .where(Product.id == product_id, Product.stock >= quantity)
            .values(stock=Product.stock - quantity)
        )
        result = await self.db.execute(stmt)
        return result.rowcount > 0
