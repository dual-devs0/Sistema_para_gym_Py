from datetime import datetime

from pydantic import BaseModel


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
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GymUpdate(BaseModel):
    name: str | None = None
    logo_url: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    currency: str | None = None
    timezone: str | None = None
    business_hours: dict | None = None
