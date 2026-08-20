import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreateRequest, ProductResponse, ProductUpdateRequest


class ProductService:
    def __init__(self, db: AsyncSession):
        self.repo = ProductRepository(db)

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[ProductResponse]:
        products = await self.repo.list_by_gym(gym_id)
        return [ProductResponse.model_validate(p) for p in products]

    async def create(self, gym_id: uuid.UUID, body: ProductCreateRequest) -> ProductResponse:
        product = Product(
            gym_id=gym_id,
            name=body.name,
            price=body.price,
            stock=body.stock,
            low_stock_threshold=body.low_stock_threshold,
        )
        created = await self.repo.create(product)
        return ProductResponse.model_validate(created)

    async def update(self, product_id: uuid.UUID, gym_id: uuid.UUID, body: ProductUpdateRequest) -> ProductResponse:
        product = await self.repo.get_by_id(product_id, gym_id)
        if not product:
            raise NotFoundException("Product not found")

        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(product, field, value)

        updated = await self.repo.update(product)
        return ProductResponse.model_validate(updated)
