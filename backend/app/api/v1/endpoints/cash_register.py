import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.cash_register import (
    CashShiftOpenRequest,
    CashShiftResponse,
    CashWithdrawalRequest,
    CashWithdrawalResponse,
)
from app.services.audit_service import AuditService
from app.services.cash_register_service import CashRegisterService

router = APIRouter(prefix="/cash-register", tags=["cash-register"])


@router.get("/current", response_model=CashShiftResponse | None)
async def get_current_shift(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.CASH_SHIFT_READ)),
):
    service = CashRegisterService(db)
    return await service.get_current(gym_id)


@router.post("/open", response_model=CashShiftResponse, status_code=201)
async def open_shift(
    body: CashShiftOpenRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.CASH_SHIFT_OPEN)),
):
    service = CashRegisterService(db)
    result = await service.open(gym_id, user.id, body.opening_amount)
    await AuditService(db, user_id=user.id, gym_id=gym_id).log(
        AuditService.ACTIONS["OPEN"], "cashregistershift", record_id=result.id,
        changes={"opening_amount": body.opening_amount},
    )
    return result


@router.post("/withdrawals", response_model=CashWithdrawalResponse, status_code=201)
async def add_withdrawal(
    body: CashWithdrawalRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.CASH_SHIFT_WITHDRAW)),
):
    service = CashRegisterService(db)
    result = await service.add_withdrawal(gym_id, user.id, body.amount, body.motivo)
    await AuditService(db, user_id=user.id, gym_id=gym_id).log(
        AuditService.ACTIONS["WITHDRAW"], "cashwithdrawal", record_id=result.id,
        changes={"amount": body.amount, "motivo": body.motivo},
    )
    return result


@router.post("/close", response_model=CashShiftResponse)
async def close_shift(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.CASH_SHIFT_CLOSE)),
):
    service = CashRegisterService(db)
    result = await service.close(gym_id, user.id)
    await AuditService(db, user_id=user.id, gym_id=gym_id).log(
        AuditService.ACTIONS["CLOSE"], "cashregistershift", record_id=result.id,
        changes={
            "cash_total": result.cash_total,
            "card_total": result.card_total,
            "transfer_total": result.transfer_total,
            "other_total": result.other_total,
            "withdrawals_total": result.withdrawals_total,
            "expected_cash": result.expected_cash,
        },
    )
    return result
