from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class GymResponse(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    currency: str
    timezone: str
    business_hours: dict | None = None
    is_active: bool
    notifications_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class GymUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    logo_url: str | None = Field(None, max_length=500)
    address: str | None = Field(None, max_length=300)
    phone: str | None = Field(None, max_length=50)
    email: str | None = None
    currency: str | None = Field(None, max_length=10)
    timezone: str | None = Field(None, max_length=50)
    business_hours: dict | None = None
    notifications_enabled: bool | None = None
