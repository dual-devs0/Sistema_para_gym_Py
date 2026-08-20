import uuid

import pytest

from app.core.exceptions import AppException, NotFoundException
from app.services.payment_service import PaymentService


@pytest.mark.asyncio
async def test_register_payment_member_not_found(db_session):
    service = PaymentService(db_session)
    with pytest.raises(NotFoundException):
        await service.register(uuid.uuid4(), uuid.uuid4(), 499, "efectivo")


@pytest.mark.asyncio
async def test_register_payment_creates_invoice(db_session, gym_id, member_id):
    service = PaymentService(db_session)
    result = await service.register(gym_id, member_id, 499, "efectivo")
    assert result.amount == 499
    assert result.status == "paid"


@pytest.mark.asyncio
async def test_refund_not_found(db_session):
    service = PaymentService(db_session)
    with pytest.raises(NotFoundException):
        await service.refund(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_refund_payment(db_session, gym_id, member_id):
    service = PaymentService(db_session)
    result = await service.register(gym_id, member_id, 499, "efectivo")
    refunded = await service.refund(uuid.UUID(result.id), gym_id)
    assert refunded.status == "refunded"


@pytest.mark.asyncio
async def test_refund_already_refunded(db_session, gym_id, member_id):
    service = PaymentService(db_session)
    result = await service.register(gym_id, member_id, 499, "efectivo")
    payment_id = uuid.UUID(result.id)
    await service.refund(payment_id, gym_id)
    with pytest.raises(AppException):
        await service.refund(payment_id, gym_id)


@pytest.mark.asyncio
async def test_list_payments_by_gym(db_session, gym_id, member_id):
    service = PaymentService(db_session)
    await service.register(gym_id, member_id, 100, "efectivo")
    await service.register(gym_id, member_id, 200, "tarjeta")
    payments = await service.list_by_gym(gym_id)
    assert len(payments) == 2
