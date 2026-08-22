from datetime import date, timedelta

import pytest

from app.core.config import settings
from app.models.membership import MemberMembership, MembershipPlan
from app.services.notification_service import NotificationService


@pytest.mark.asyncio
async def test_send_payment_confirmation_disabled_without_api_key(db_session, gym_id, member_id):
    assert settings.whatsapp_api_key is None  # sanity: no creds configured in this env
    service = NotificationService(db_session)
    log = await service.send_payment_confirmation(
        gym_id=gym_id,
        member_id=member_id,
        member_name="Marcus Aurelio",
        member_phone="+595981000000",
        amount=150000,
        paid_at=None,
        member_membership_id=None,
    )
    assert log.status == "disabled"
    assert log.sent_at is None


@pytest.mark.asyncio
async def test_send_payment_confirmation_no_phone_stays_disabled(monkeypatch, db_session, gym_id, member_id):
    monkeypatch.setattr(settings, "whatsapp_api_key", "fake-key-for-test")
    service = NotificationService(db_session)
    log = await service.send_payment_confirmation(
        gym_id=gym_id,
        member_id=member_id,
        member_name="Marcus Aurelio",
        member_phone=None,
        amount=150000,
        paid_at=None,
        member_membership_id=None,
    )
    # Even with an API key configured, no phone on file means nothing to send to.
    assert log.status == "disabled"


@pytest.mark.asyncio
async def test_send_expiry_reminders_disabled_and_not_duplicated(db_session, gym_id, member_id):
    plan = MembershipPlan(gym_id=gym_id, name="Mensual", price=120000, duration_days=30, type="mensual")
    db_session.add(plan)
    await db_session.flush()
    membership = MemberMembership(
        member_id=member_id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=28),
        end_date=date.today() + timedelta(days=2),
        price_paid=120000,
        status="active",
    )
    db_session.add(membership)
    await db_session.commit()

    service = NotificationService(db_session)
    first = await service.send_expiry_reminders(gym_id, days=3)
    assert len(first) == 1
    assert first[0].status == "disabled"

    second = await service.send_expiry_reminders(gym_id, days=3)
    assert second == []  # already logged for this membership, cron must not resend


@pytest.mark.asyncio
async def test_whatsapp_client_payload_shape_when_enabled(monkeypatch):
    from app.services import whatsapp_client as whatsapp_client_module

    monkeypatch.setattr(settings, "whatsapp_api_key", "fake-key-for-test")
    monkeypatch.setattr(settings, "whatsapp_sender_channel", "fake-channel")

    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"messages": [{"id": "wamid.fake123"}]}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, json, headers):
            captured["url"] = url
            captured["json"] = json
            captured["headers"] = headers
            return FakeResponse()

    monkeypatch.setattr(whatsapp_client_module.httpx, "AsyncClient", FakeAsyncClient)

    client = whatsapp_client_module.WhatsAppClient()
    result = await client.send_template("+595981000000", "payment_confirmation", ["Marcus", "₲ 150.000"])

    assert result == {"status": "sent", "provider_message_id": "wamid.fake123"}
    assert captured["url"] == "/messages"
    assert captured["json"]["to"] == "+595981000000"
    assert captured["json"]["template"]["name"] == "payment_confirmation"
    assert captured["headers"]["D360-API-KEY"] == "fake-key-for-test"
