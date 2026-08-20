from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ProductResponse(BaseModel):
    id: str
    gym_id: str
    name: str
    price: float
    stock: int
    low_stock_threshold: int
    is_active: bool

    model_config = {"from_attributes": True}

    @field_validator("id", "gym_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)


class ProductUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    price: float | None = Field(None, gt=0)
    stock: int | None = Field(None, ge=0)
    low_stock_threshold: int | None = Field(None, ge=0)
    is_active: bool | None = None
