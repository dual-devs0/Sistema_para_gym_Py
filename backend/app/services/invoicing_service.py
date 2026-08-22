import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.invoicing import SifenDocument
from app.repositories.invoicing_repository import (
    GymFiscalConfigRepository,
    SifenDocumentRepository,
    TimbradoRepository,
)


class InvoicingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.fiscal_config_repo = GymFiscalConfigRepository(db)
        self.timbrado_repo = TimbradoRepository(db)
        self.document_repo = SifenDocumentRepository(db)

    async def is_fiscal_ready(self, gym_id: uuid.UUID) -> bool:
        config = await self.fiscal_config_repo.get_by_gym(gym_id)
        if not config or not config.ruc or not config.razon_social:
            return False
        timbrado = await self.timbrado_repo.get_active(gym_id)
        if not timbrado or timbrado.fecha_vencimiento < date.today():
            return False
        # TODO Sub-entrega 3b: chequear que el gimnasio tenga un certificado
        # digital cargado (tabla SifenCertificate, todavia no existe).
        # Mientras esa pieza no exista, esto SIEMPRE devuelve False, para
        # que el sistema nunca intente timbrar de verdad sin certificado.
        certificate_loaded = False
        return certificate_loaded

    async def generate_for_payment(self, gym_id: uuid.UUID, payment_id: uuid.UUID) -> SifenDocument:
        existing = await self.document_repo.get_by_payment(payment_id)
        if existing and existing.status not in ("pending_stamping", "error"):
            return existing

        ready = await self.is_fiscal_ready(gym_id)
        if not ready:
            if existing:
                return existing
            document = SifenDocument(
                payment_id=payment_id,
                gym_id=gym_id,
                status="pending_stamping",
                environment=settings.sifen_environment,
                error_message="Gimnasio sin configuracion fiscal completa (RUC, timbrado o certificado).",
            )
            return await self.document_repo.create(document)

        # Sub-entrega 3b completa esta rama: build_de_xml + sign_de_xml +
        # SifenClient.send_de con el certificado real del gimnasio.
        raise NotImplementedError("Fiscal transmission requires a gym certificate (Sub-entrega 3b)")

    async def retry_pending(self, gym_id: uuid.UUID) -> list[SifenDocument]:
        pending = await self.document_repo.list_pending_by_gym(gym_id)
        retried = []
        for document in pending:
            document.retry_count += 1
            await self.document_repo.update(document)
            retried.append(await self.generate_for_payment(gym_id, document.payment_id))
        return retried

    async def get_by_payment(self, payment_id: uuid.UUID) -> SifenDocument | None:
        return await self.document_repo.get_by_payment(payment_id)
