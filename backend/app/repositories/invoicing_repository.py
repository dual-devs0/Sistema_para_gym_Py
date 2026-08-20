import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invoicing import GymFiscalConfig, SifenDocument, Timbrado


class GymFiscalConfigRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_gym(self, gym_id: uuid.UUID) -> GymFiscalConfig | None:
        result = await self.db.execute(select(GymFiscalConfig).where(GymFiscalConfig.gym_id == gym_id))
        return result.scalar_one_or_none()

    async def create(self, config: GymFiscalConfig) -> GymFiscalConfig:
        self.db.add(config)
        await self.db.flush()
        await self.db.refresh(config)
        return config

    async def update(self, config: GymFiscalConfig) -> GymFiscalConfig:
        await self.db.flush()
        await self.db.refresh(config)
        return config


class TimbradoRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active(self, gym_id: uuid.UUID) -> Timbrado | None:
        result = await self.db.execute(
            select(Timbrado).where(Timbrado.gym_id == gym_id, Timbrado.is_active.is_(True))
        )
        return result.scalar_one_or_none()

    async def list_by_gym(self, gym_id: uuid.UUID) -> list[Timbrado]:
        result = await self.db.execute(
            select(Timbrado).where(Timbrado.gym_id == gym_id).order_by(Timbrado.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, timbrado: Timbrado) -> Timbrado:
        self.db.add(timbrado)
        await self.db.flush()
        await self.db.refresh(timbrado)
        return timbrado

    async def update(self, timbrado: Timbrado) -> Timbrado:
        await self.db.flush()
        await self.db.refresh(timbrado)
        return timbrado


class SifenDocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_payment(self, payment_id: uuid.UUID) -> SifenDocument | None:
        result = await self.db.execute(select(SifenDocument).where(SifenDocument.payment_id == payment_id))
        return result.scalar_one_or_none()

    async def list_pending_by_gym(self, gym_id: uuid.UUID) -> list[SifenDocument]:
        result = await self.db.execute(
            select(SifenDocument).where(
                SifenDocument.gym_id == gym_id,
                SifenDocument.status.in_(["pending_stamping", "error"]),
            )
        )
        return list(result.scalars().all())

    async def create(self, document: SifenDocument) -> SifenDocument:
        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def update(self, document: SifenDocument) -> SifenDocument:
        await self.db.flush()
        await self.db.refresh(document)
        return document
