"""Transmission to SIFEN's SOAP web services.

Confirmed by Manual Tecnico v150 sec. 7.9/7.10: SOAP 1.2, WS-I Basic
Profile, Document/Literal, TLS 1.2 with MUTUAL auth (the gym's own
certificate is the TLS client cert, not just the signer). The envelope is
built by hand with httpx instead of a WSDL-driven library (zeep etc.)
specifically so the signed XML bytes reach the wire unmodified — a
SOAP library that reparses/reserializes the body risks invalidating the
enveloped signature's canonicalization.

Blocked from a real send in Sub-entrega 3a: mTLS needs a real gym
certificate (Sub-entrega 3b). This client is written and unit-tested
against a mocked httpx transport in the meantime, mirroring how
whatsapp_client.py was built and tested before 360dialog credentials
existed in Fase 2.
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SOAP_ENVELOPE_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <rEnviDe xmlns="http://ekuatia.set.gov.py/sifen/xsd">
      {signed_de_xml}
    </rEnviDe>
  </soap:Body>
</soap:Envelope>"""


class SifenClient:
    def __init__(self, client_cert_path: str | None = None, client_key_path: str | None = None) -> None:
        # No per-gym certificate wired yet (Sub-entrega 3b) — always disabled today.
        self.enabled = bool(client_cert_path and client_key_path)
        self.client_cert_path = client_cert_path
        self.client_key_path = client_key_path
        self.base_url = settings.sifen_base_url

    async def send_de(self, signed_de_xml: bytes) -> dict:
        if not self.enabled:
            logger.info("SIFEN transmission disabled (no gym certificate configured), skipping send")
            return {"status": "disabled"}

        envelope = SOAP_ENVELOPE_TEMPLATE.format(signed_de_xml=signed_de_xml.decode())
        try:
            async with httpx.AsyncClient(
                base_url=self.base_url,
                cert=(self.client_cert_path, self.client_key_path),
                timeout=30.0,
            ) as client:
                response = await client.post(
                    "/de/ws/sync/recibe.wsdl",
                    content=envelope.encode(),
                    headers={"Content-Type": "application/soap+xml; charset=utf-8"},
                )
                response.raise_for_status()
                return {"status": "transmitted", "raw_response": response.text}
        except Exception as exc:  # noqa: BLE001 - any failure must degrade to "failed", never raise
            logger.exception("SIFEN transmission failed")
            return {"status": "failed", "error": str(exc)}
