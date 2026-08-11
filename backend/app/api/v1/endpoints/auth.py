import uuid

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_platform_staff
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limiter import rate_limit
from app.models.gym import Gym
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


@router.post("/register")
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(require_platform_staff()),
):
    service = AuthService(db)
    gym_id = uuid.uuid4()
    gym = Gym(id=gym_id, name=f"{body.full_name}'s Gym")
    db.add(gym)
    await db.flush()
    await service.register_owner(body.email, body.password, body.full_name, gym_id)
    access_token, refresh_token, _, _ = await service.login(body.email, body.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
@rate_limit(settings.rate_limit_login_per_minute)
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    access_token, refresh_token, _, previous_login = await service.login(body.email, body.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, previous_login=previous_login)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    access_token, refresh_token = await service.refresh(body.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "gym_id": str(current_user.gym_id) if current_user.gym_id else None,
        "gym": (
            {
                "name": current_user.gym.name,
                "currency": current_user.gym.currency,
                "timezone": current_user.gym.timezone,
            }
            if current_user.gym
            else None
        ),
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
    }


@router.post("/logout", status_code=204)
async def logout(
    authorization: str | None = Header(default=None),
    current_user: User = Depends(get_current_user),
):
    service = AuthService(None)
    token = (authorization or "").replace("Bearer ", "")
    await service.logout(token)
    return None


@router.post("/forgot-password", status_code=204)
@rate_limit(settings.rate_limit_login_per_minute)
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.forgot_password(body.email)
    return None


@router.post("/reset-password", status_code=204)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.reset_password(body.token, body.password)
    return None
