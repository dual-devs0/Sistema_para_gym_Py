from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None = None
    avatar_url: str | None = None
    role: str
    is_active: bool
    last_login: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    role: str = "member"


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserInvite(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "trainer"
