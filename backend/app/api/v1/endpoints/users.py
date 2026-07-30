import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.schemas.user import InviteResponse, UserCreate, UserInvite, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.USER_READ)),
):
    service = UserService(db)
    return await service.list_by_gym(gym_id)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.USER_READ)),
):
    service = UserService(db)
    return await service.get_by_id(user_id, gym_id)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.USER_CREATE)),
):
    service = UserService(db)
    return await service.create(body.email, body.password, body.full_name, body.role, gym_id)


@router.post("/invite", response_model=InviteResponse, status_code=201)
async def invite_user(
    body: UserInvite,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.USER_CREATE)),
):
    service = UserService(db)
    created, temp_password = await service.invite(body.email, body.full_name, body.role, gym_id)
    return InviteResponse(user=created, temporary_password=temp_password)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.USER_UPDATE)),
):
    service = UserService(db)
    return await service.update(user_id, gym_id, body.model_dump(exclude_unset=True))


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.USER_DELETE)),
):
    service = UserService(db)
    await service.delete(user_id, gym_id)
