import uuid
from datetime import date, timedelta

import pytest

from app.models.invoicing import GymFiscalConfig, Timbrado
from app.services.invoicing_service import InvoicingService


@pytest.mark.asyncio
async def test_not_ready_without_fiscal_config(db_session, gym_id):
    service = InvoicingService(db_session)
    assert await service.is_fiscal_ready(gym_id) is False


@pytest.mark.asyncio
async def test_not_ready_with_config_but_no_timbrado(db_session, gym_id):
    db_session.add(GymFiscalConfig(gym_id=gym_id, ruc="4444401", razon_social="Gimnasio Test SA"))
    await db_session.commit()
    service = InvoicingService(db_session)
    assert await service.is_fiscal_ready(gym_id) is False


@pytest.mark.asyncio
async def test_not_ready_with_expired_timbrado(db_session, gym_id):
    db_session.add(GymFiscalConfig(gym_id=gym_id, ruc="4444401", razon_social="Gimnasio Test SA"))
    db_session.add(
        Timbrado(
            gym_id=gym_id,
            establecimiento="001",
            punto_expedicion="001",
            numero_desde=1,
            numero_hasta=9999999,
            numero_actual=1,
            fecha_vencimiento=date.today() - timedelta(days=1),
            is_active=True,
        )
    )
    await db_session.commit()
    service = InvoicingService(db_session)
    assert await service.is_fiscal_ready(gym_id) is False


@pytest.mark.asyncio
async def test_still_not_ready_with_full_config_because_no_certificate_yet(db_session, gym_id):
    # Sub-entrega 3b hasn't landed a certificate table: is_fiscal_ready must
    # stay False even with a complete, valid fiscal config + timbrado — the
    # system must never attempt a real SIFEN transmission without a cert.
    db_session.add(GymFiscalConfig(gym_id=gym_id, ruc="4444401", razon_social="Gimnasio Test SA"))
    db_session.add(
        Timbrado(
            gym_id=gym_id,
            establecimiento="001",
            punto_expedicion="001",
            numero_desde=1,
            numero_hasta=9999999,
            numero_actual=1,
            fecha_vencimiento=date.today() + timedelta(days=365),
            is_active=True,
        )
    )
    await db_session.commit()
    service = InvoicingService(db_session)
    assert await service.is_fiscal_ready(gym_id) is False


@pytest.mark.asyncio
async def test_generate_for_payment_without_fiscal_config_stays_pending(db_session, gym_id, member_id):
    from app.services.payment_service import PaymentService

    payment_service = PaymentService(db_session)
    payment = await payment_service.register(gym_id, member_id, 150000, "efectivo")

    service = InvoicingService(db_session)
    document = await service.get_by_payment(uuid.UUID(payment.id))
    assert document is not None
    assert document.status == "pending_stamping"
    assert "certificado" in document.error_message.lower() or "fiscal" in document.error_message.lower()


@pytest.mark.asyncio
async def test_generate_for_payment_is_idempotent(db_session, gym_id, member_id):
    from app.services.payment_service import PaymentService

    payment = await PaymentService(db_session).register(gym_id, member_id, 150000, "efectivo")
    payment_id = uuid.UUID(payment.id)

    service = InvoicingService(db_session)
    # register() above already created one via _generate_sifen_document —
    # calling generate_for_payment again must not create a second row.
    first = await service.get_by_payment(payment_id)
    second = await service.generate_for_payment(gym_id, payment_id)
    assert first.id == second.id


@pytest.mark.asyncio
async def test_retry_pending_does_not_duplicate_documents(db_session, gym_id, member_id):
    from app.services.payment_service import PaymentService

    payment_service = PaymentService(db_session)
    payment = await payment_service.register(gym_id, member_id, 150000, "efectivo")

    service = InvoicingService(db_session)
    await service.retry_pending(gym_id)
    await service.retry_pending(gym_id)

    document = await service.get_by_payment(uuid.UUID(payment.id))
    assert document.retry_count == 2
    assert document.status == "pending_stamping"
