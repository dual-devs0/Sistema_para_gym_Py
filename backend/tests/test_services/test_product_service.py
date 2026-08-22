import uuid

import pytest

from app.core.exceptions import AppException
from app.schemas.payment import PaymentItemRequest
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService


@pytest.mark.asyncio
async def test_create_and_list_products(db_session, gym_id):
    service = ProductService(db_session)
    await service.create(gym_id, ProductCreateRequest(name="Agua 500ml", price=8000, stock=20, low_stock_threshold=5))
    products = await service.list_by_gym(gym_id)
    assert len(products) == 1
    assert products[0].name == "Agua 500ml"
    assert products[0].stock == 20


@pytest.mark.asyncio
async def test_update_product_partial_fields(db_session, gym_id):
    service = ProductService(db_session)
    created = await service.create(gym_id, ProductCreateRequest(name="Barrita", price=10000, stock=10))
    updated = await service.update(uuid.UUID(created.id), gym_id, ProductUpdateRequest(stock=3))
    assert updated.stock == 3
    assert updated.name == "Barrita"


@pytest.mark.asyncio
async def test_sale_decrements_stock_atomically(db_session, gym_id, member_id):
    product_service = ProductService(db_session)
    payment_service = PaymentService(db_session)

    product = await product_service.create(gym_id, ProductCreateRequest(name="Agua 500ml", price=8000, stock=10))

    result = await payment_service.register(
        gym_id, member_id, 0, "efectivo",
        items=[PaymentItemRequest(product_id=product.id, quantity=3)],
    )
    assert result.amount == 24000
    assert len(result.items) == 1
    assert result.items[0].quantity == 3
    assert result.items[0].unit_price == 8000
    assert result.items[0].subtotal == 24000

    products = await product_service.list_by_gym(gym_id)
    assert products[0].stock == 7
    assert uuid.UUID(product.id) == uuid.UUID(products[0].id)


@pytest.mark.asyncio
async def test_sale_rejects_when_stock_insufficient(db_session, gym_id, member_id):
    product_service = ProductService(db_session)
    payment_service = PaymentService(db_session)

    product = await product_service.create(gym_id, ProductCreateRequest(name="Barrita", price=5000, stock=2))

    with pytest.raises(AppException):
        await payment_service.register(
            gym_id, member_id, 0, "efectivo",
            items=[PaymentItemRequest(product_id=product.id, quantity=5)],
        )

    products = await product_service.list_by_gym(gym_id)
    assert products[0].stock == 2  # unchanged — payment was never created


@pytest.mark.asyncio
async def test_price_is_snapshotted_from_product_not_client(db_session, gym_id, member_id):
    product_service = ProductService(db_session)
    payment_service = PaymentService(db_session)

    product = await product_service.create(gym_id, ProductCreateRequest(name="Agua 500ml", price=8000, stock=10))
    await payment_service.register(
        gym_id, member_id, 0, "efectivo",
        items=[PaymentItemRequest(product_id=product.id, quantity=1)],
    )

    await product_service.update(uuid.UUID(product.id), gym_id, ProductUpdateRequest(price=15000))

    result = await payment_service.register(
        gym_id, member_id, 0, "efectivo",
        items=[PaymentItemRequest(product_id=product.id, quantity=1)],
    )
    assert result.items[0].unit_price == 15000  # new sale uses the new price
    assert result.amount == 15000


@pytest.mark.asyncio
async def test_mixed_sale_combines_base_amount_and_cantina_subtotal(db_session, gym_id, member_id):
    product_service = ProductService(db_session)
    payment_service = PaymentService(db_session)

    product = await product_service.create(gym_id, ProductCreateRequest(name="Agua 500ml", price=8000, stock=10))
    result = await payment_service.register(
        gym_id, member_id, 150000, "efectivo",
        items=[PaymentItemRequest(product_id=product.id, quantity=2)],
    )
    assert result.amount == 150000 + 16000
