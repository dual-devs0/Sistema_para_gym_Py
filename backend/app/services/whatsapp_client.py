import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class WhatsAppClient:
    """Thin wrapper over the 360dialog API (BSP on top of Meta Cloud API).

    No-ops when WHATSAPP_360DIALOG_API_KEY isn't set, and never raises — a
    failed/disabled WhatsApp send must never break payment registration or
    the expiry-reminder cron. Callers only need to check the returned status.
    """

    def __init__(self) -> None:
        self.enabled = settings.whatsapp_enabled

    async def send_template(self, to_phone: str, template_name: str, params: list[str]) -> dict:
        if not self.enabled:
            logger.info("WhatsApp notifications disabled (no API key), skipping send of %s", template_name)
            return {"status": "disabled"}

        payload = {
            "to": to_phone,
            "type": "template",
            "template": {
                "namespace": settings.whatsapp_sender_channel,
                "name": template_name,
                "language": {"code": "es"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": p} for p in params],
                    }
                ],
            },
        }
        headers = {"D360-API-KEY": settings.whatsapp_api_key, "Content-Type": "application/json"}

        try:
            async with httpx.AsyncClient(base_url=settings.whatsapp_base_url, timeout=10.0) as client:
                response = await client.post("/messages", json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                message_id = (data.get("messages") or [{}])[0].get("id")
                return {"status": "sent", "provider_message_id": message_id}
        except Exception as exc:  # noqa: BLE001 - any failure must degrade to "failed", never raise
            logger.exception("WhatsApp send failed for template %s", template_name)
            return {"status": "failed", "error": str(exc)}
