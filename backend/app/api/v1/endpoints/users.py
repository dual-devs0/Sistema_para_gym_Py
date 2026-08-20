import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_gym_id, get_current_user, require_permission
from app.core.database import get_db
from app.core.permissions import Perm
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, InviteResponse, UserCreate, UserInvite, UserResponse, UserUpdate
from app.services.audit_service import AuditService
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.put("/me/password", status_code=204)
async def change_my_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = UserService(db)
    await service.change_password(current_user, body.current_password, body.new_password)


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
    target_before = await service.get_by_id(user_id, gym_id)
    old_role = target_before.role
    data = body.model_dump(exclude_unset=True)
    updated = await service.update(user_id, gym_id, data)
    if "role" in data and data["role"] != old_role:
        await AuditService(db, user_id=user.id, gym_id=gym_id).log(
            AuditService.ACTIONS["ROLE_CHANGE"],
            "user",
            record_id=str(user_id),
            changes={"from": old_role, "to": data["role"]},
        )
    return updated


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    gym_id: uuid.UUID = Depends(get_current_gym_id),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission(Perm.USER_DELETE)),
):
    service = UserService(db)
    await service.delete(user_id, gym_id)
