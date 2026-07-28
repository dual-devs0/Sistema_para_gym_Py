from datetime import date, datetime

from pydantic import BaseModel


class MemberResponse(BaseModel):
    id: str
    gym_id: str
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    document_number: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    photo_url: str | None = None
    notes: str | None = None
    status: str
    registered_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    document_number: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    photo_url: str | None = None
    notes: str | None = None


class MemberUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    document_number: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    photo_url: str | None = None
    notes: str | None = None
    status: str | None = None
