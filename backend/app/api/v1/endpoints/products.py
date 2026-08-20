import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.product import ProductCreateRequest, ProductResponse, ProductUpdateRequest
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
async def list_products(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PRODUCT_READ)),
):
    service = ProductService(db)
    return await service.list_by_gym(gym_id)


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    body: ProductCreateRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PRODUCT_MANAGE)),
):
    service = ProductService(db)
    return await service.create(gym_id, body)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdateRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.PRODUCT_MANAGE)),
):
    service = ProductService(db)
    return await service.update(product_id, gym_id, body)
