import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.balance import MemberBalanceAdjustRequest, MemberBalanceMovementResponse
from app.services.audit_service import AuditService
from app.services.balance_service import BalanceService

router = APIRouter(prefix="/balance", tags=["balance"])


@router.get("/{member_id}", response_model=list[MemberBalanceMovementResponse])
async def list_movements(
    member_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_BALANCE_READ)),
):
    service = BalanceService(db)
    return await service.list_by_member(member_id, gym_id)


@router.post("/{member_id}/adjust", response_model=MemberBalanceMovementResponse, status_code=201)
async def adjust_balance(
    member_id: uuid.UUID,
    body: MemberBalanceAdjustRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.MEMBER_BALANCE_ADJUST)),
):
    service = BalanceService(db)
    result = await service.adjust(member_id, gym_id, body.amount, body.motivo, user.id)
    await AuditService(db, user_id=user.id, gym_id=gym_id).log(
        AuditService.ACTIONS["ADJUST"],
        "memberbalancemovement",
        record_id=result.id,
        changes={"amount": body.amount, "motivo": body.motivo, "member_id": str(member_id)},
    )
    return result
