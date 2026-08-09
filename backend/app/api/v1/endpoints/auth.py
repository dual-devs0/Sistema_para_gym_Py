import uuid

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, require_platform_staff
from app.core.database import get_db
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
    access_token, refresh_token, _ = await service.login(body.email, body.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


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
    }


@router.post("/logout", status_code=204)
async def logout(
    authorization: str = Header(...),
    current_user: User = Depends(get_current_user),
):
    service = AuthService(None)
    token = authorization.replace("Bearer ", "")
    await service.logout(token)
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
