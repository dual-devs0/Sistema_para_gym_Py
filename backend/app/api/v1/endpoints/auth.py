from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.core.exceptions import ForbiddenException
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Public self-service signup is disabled: GymPro accounts are provisioned manually
    # by the GymPro team, not created by gym owners themselves. Endpoint kept (not deleted)
    # as the base for a future internal "create new client gym" tool, gated by a platform-level
    # staff role that doesn't exist yet (see ARQUITECTURA.md — roles today are all scoped to a gym_id).
    raise ForbiddenException(
        "Public registration is disabled. Gym accounts are provisioned by the GymPro team."
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    access_token, refresh_token, _ = await service.login(body.email, body.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    access_token, refresh_token = await service.refresh(body.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", status_code=204)
async def logout(current_user: User = Depends(get_current_user)):
    return None


@router.post("/forgot-password", status_code=204)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.forgot_password(body.email)
    return None


@router.post("/reset-password", status_code=204)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.reset_password(body.token, body.password)
    return None
