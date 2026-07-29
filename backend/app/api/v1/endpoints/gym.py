import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.gym import GymResponse, GymUpdate
from app.services.gym_service import GymService

router = APIRouter(prefix="/gym", tags=["gym"])


@router.get("/settings", response_model=GymResponse)
async def get_settings(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.GYM_SETTINGS_READ)),
):
    service = GymService(db)
    return await service.get_settings(gym_id)


@router.put("/settings", response_model=GymResponse)
async def update_settings(
    body: GymUpdate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.GYM_SETTINGS_UPDATE)),
):
    service = GymService(db)
    return await service.update_settings(gym_id, body.model_dump(exclude_unset=True))
