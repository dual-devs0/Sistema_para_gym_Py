from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


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
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class MemberCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    document_number: str | None = Field(None, max_length=30)
    birth_date: date | None = None
    gender: str | None = Field(None, max_length=20)
    photo_url: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, max_length=2000)


class MemberUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    document_number: str | None = Field(None, max_length=30)
    birth_date: date | None = None
    gender: str | None = Field(None, max_length=20)
    photo_url: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, max_length=2000)
    status: str | None = Field(None, max_length=20)
