import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.core.permissions import Perm
from app.models.invoicing import GymFiscalConfig, Timbrado
from app.repositories.invoicing_repository import GymFiscalConfigRepository, TimbradoRepository
from app.schemas.invoicing import (
    GymFiscalConfigResponse,
    GymFiscalConfigUpdate,
    SifenDocumentResponse,
    TimbradoCreate,
    TimbradoResponse,
)
from app.services.audit_service import AuditService
from app.services.invoicing_service import InvoicingService

router = APIRouter(prefix="/invoicing", tags=["invoicing"])


@router.get("/fiscal-config", response_model=GymFiscalConfigResponse | None)
async def get_fiscal_config(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.INVOICING_READ)),
):
    return await GymFiscalConfigRepository(db).get_by_gym(gym_id)


@router.put("/fiscal-config", response_model=GymFiscalConfigResponse)
async def update_fiscal_config(
    body: GymFiscalConfigUpdate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.INVOICING_MANAGE)),
):
    repo = GymFiscalConfigRepository(db)
    config = await repo.get_by_gym(gym_id)
    action = AuditService.ACTIONS["UPDATE"]
    if not config:
        config = GymFiscalConfig(gym_id=gym_id, ruc=body.ruc, razon_social=body.razon_social)
        config = await repo.create(config)
        action = AuditService.ACTIONS["CREATE"]
    else:
        if body.ruc is not None:
            config.ruc = body.ruc
        if body.razon_social is not None:
            config.razon_social = body.razon_social
        config = await repo.update(config)
    await AuditService(db, user_id=user.id, gym_id=gym_id).log(action, "gymfiscalconfig", record_id=str(config.id))
    return config


@router.get("/timbrado", response_model=list[TimbradoResponse])
async def list_timbrados(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.INVOICING_READ)),
):
    return await TimbradoRepository(db).list_by_gym(gym_id)


@router.post("/timbrado", response_model=TimbradoResponse, status_code=201)
async def create_timbrado(
    body: TimbradoCreate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.INVOICING_MANAGE)),
):
    repo = TimbradoRepository(db)
    # Only one active timbrado per gym: deactivate any existing before creating the new one.
    current = await repo.get_active(gym_id)
    if current:
        current.is_active = False
        await repo.update(current)

    timbrado = Timbrado(
        gym_id=gym_id,
        establecimiento=body.establecimiento,
        punto_expedicion=body.punto_expedicion,
        numero_desde=body.numero_desde,
        numero_hasta=body.numero_hasta,
        numero_actual=body.numero_desde,
        fecha_vencimiento=body.fecha_vencimiento,
        is_active=True,
    )
    created = await repo.create(timbrado)
    await AuditService(db, user_id=user.id, gym_id=gym_id).log(
        AuditService.ACTIONS["CREATE"], "timbrado", record_id=str(created.id)
    )
    return created


@router.get("/documents/by-payment/{payment_id}", response_model=SifenDocumentResponse)
async def get_document_by_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.INVOICING_READ)),
):
    service = InvoicingService(db)
    document = await service.get_by_payment(payment_id)
    if not document:
        raise NotFoundException("No SIFEN document for this payment yet")
    return document
