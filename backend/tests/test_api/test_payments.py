import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_payments_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/payments")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_payment_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/payments",
        json={"member_id": "00000000-0000-0000-0000-000000000000", "amount": 499, "payment_method": "efectivo"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refund_unauthorized(client: AsyncClient):
    response = await client.put("/api/v1/payments/00000000-0000-0000-0000-000000000000/refund")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_invoice_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/payments/00000000-0000-0000-0000-000000000000/invoice")
    assert response.status_code == 401
