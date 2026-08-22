from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class GymFiscalConfigResponse(BaseModel):
    id: str
    gym_id: str
    ruc: str | None = None
    razon_social: str | None = None
    sifen_environment: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "gym_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class GymFiscalConfigUpdate(BaseModel):
    ruc: str | None = Field(None, max_length=20)
    razon_social: str | None = Field(None, max_length=200)


class TimbradoResponse(BaseModel):
    id: str
    gym_id: str
    establecimiento: str
    punto_expedicion: str
    numero_desde: int
    numero_hasta: int
    numero_actual: int
    fecha_vencimiento: date
    is_active: bool

    model_config = {"from_attributes": True}

    @field_validator("id", "gym_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v


class TimbradoCreate(BaseModel):
    establecimiento: str = Field(..., min_length=3, max_length=3)
    punto_expedicion: str = Field(..., min_length=3, max_length=3)
    numero_desde: int = Field(..., gt=0)
    numero_hasta: int = Field(..., gt=0)
    fecha_vencimiento: date


class SifenDocumentResponse(BaseModel):
    id: str
    payment_id: str
    cdc: str | None = None
    status: str
    environment: str
    error_message: str | None = None
    retry_count: int
    protocol_number: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "payment_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if isinstance(v, UUID) else v
