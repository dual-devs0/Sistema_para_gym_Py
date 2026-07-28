from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    access_token = create_access_token(str(user.id), str(user.gym_id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found")

    access_token = create_access_token(str(user.id), str(user.gym_id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
