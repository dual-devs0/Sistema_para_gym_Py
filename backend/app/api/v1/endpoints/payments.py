import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, get_current_user, require_role
from app.core.database import get_db
from app.schemas.payment import PaymentResponse, RegisterPaymentRequest
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaymentResponse])
async def list_payments(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "receptionist")),
):
    service = PaymentService(db)
    return await service.list_by_gym(gym_id)


@router.post("", response_model=PaymentResponse, status_code=201)
async def register_payment(
    body: RegisterPaymentRequest,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "receptionist")),
):
    service = PaymentService(db)
    membership_id = uuid.UUID(body.member_membership_id) if body.member_membership_id else None
    return await service.register(
        gym_id=gym_id,
        member_id=uuid.UUID(body.member_id),
        amount=body.amount,
        payment_method=body.payment_method,
        reference=body.reference,
        notes=body.notes,
        member_membership_id=membership_id,
    )


@router.put("/{payment_id}/refund", response_model=PaymentResponse)
async def refund_payment(
    payment_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin")),
):
    service = PaymentService(db)
    return await service.refund(payment_id, gym_id)


@router.get("/{payment_id}/invoice")
async def get_invoice(
    payment_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_role("owner", "admin", "receptionist")),
):
    service = PaymentService(db)
    invoice = await service.get_invoice(payment_id, gym_id)
    return {"invoice_number": invoice.invoice_number, "pdf_url": invoice.pdf_url}
