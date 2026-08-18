import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.notification import NotificationLog
from app.repositories.gym_repository import GymRepository
from app.repositories.membership_repository import MemberMembershipRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.notification_templates import (
    EXPIRY_REMINDER_TEMPLATE,
    PAYMENT_CONFIRMATION_TEMPLATE,
    build_expiry_reminder_params,
    build_payment_confirmation_params,
)
from app.services.whatsapp_client import WhatsAppClient
from app.utils.currency import format_pyg

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)
        self.gym_repo = GymRepository(db)
        self.membership_repo = MemberMembershipRepository(db)
        self.client = WhatsAppClient()

    async def send_payment_confirmation(
        self,
        gym_id: uuid.UUID,
        member_id: uuid.UUID,
        member_name: str,
        member_phone: str | None,
        amount: float,
        paid_at: datetime | None,
        member_membership_id: uuid.UUID | None,
    ) -> NotificationLog:
        # Takes plain values, not ORM objects: this runs from a fire-and-forget
        # asyncio task on its own DB session, and passing model instances
        # across sessions hits detached/expired-instance errors.
        gym = await self.gym_repo.get_by_id(gym_id)
        gym_name = gym.name if gym else "GymPro"
        params = build_payment_confirmation_params(
            member_name=member_name,
            amount_text=format_pyg(amount),
            gym_name=gym_name,
            paid_at_text=(paid_at or datetime.now(UTC)).strftime("%d/%m/%Y"),
        )
        result = await self._send(member_phone, PAYMENT_CONFIRMATION_TEMPLATE, params)
        log = NotificationLog(
            gym_id=gym_id,
            member_id=member_id,
            member_membership_id=member_membership_id,
            type="payment_confirmation",
            status=result["status"],
            provider_message_id=result.get("provider_message_id"),
            error_message=result.get("error"),
            sent_at=datetime.now(UTC) if result["status"] == "sent" else None,
        )
        return await self.repo.create(log)

    async def send_expiry_reminders(self, gym_id: uuid.UUID, days: int | None = None) -> list[NotificationLog]:
        gym = await self.gym_repo.get_by_id(gym_id)
        gym_name = gym.name if gym else "GymPro"
        days_ahead = days or settings.whatsapp_expiry_reminder_days
        expiring = await self.membership_repo.list_expiring_soon(gym_id, days_ahead)

        logs = []
        for membership in expiring:
            already_sent = await self.repo.exists_for_membership(membership.id, "expiry_reminder")
            if already_sent:
                continue
            member = membership.member
            params = build_expiry_reminder_params(
                member_name=f"{member.first_name} {member.last_name}",
                gym_name=gym_name,
                end_date_text=membership.end_date.strftime("%d/%m/%Y"),
            )
            result = await self._send(member.phone, EXPIRY_REMINDER_TEMPLATE, params)
            log = NotificationLog(
                gym_id=gym_id,
                member_id=member.id,
                member_membership_id=membership.id,
                type="expiry_reminder",
                status=result["status"],
                provider_message_id=result.get("provider_message_id"),
                error_message=result.get("error"),
                sent_at=datetime.now(UTC) if result["status"] == "sent" else None,
            )
            logs.append(await self.repo.create(log))
        return logs

    async def list_by_member(self, member_id: uuid.UUID, gym_id: uuid.UUID) -> list[NotificationLog]:
        return await self.repo.list_by_member(member_id, gym_id)

    async def _send(self, to_phone: str | None, template: str, params: list[str]) -> dict:
        if not to_phone:
            logger.info("Member has no phone on file, skipping WhatsApp send of %s", template)
            return {"status": "disabled"}
        return await self.client.send_template(to_phone, template, params)
