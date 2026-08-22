import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.notification import NotificationLogResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/member/{member_id}", response_model=list[NotificationLogResponse])
async def list_member_notifications(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_READ)),
):
    service = NotificationService(db)
    return await service.list_by_member(member_id, gym_id)
