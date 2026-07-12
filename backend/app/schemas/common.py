from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    organization_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(ORMModel):
    id: UUID
    organization_id: UUID
    email: EmailStr
    full_name: str | None
    is_admin: bool


class APIKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class APIKeyResponse(ORMModel):
    id: UUID
    name: str
    prefix: str
    created_at: datetime
    last_used_at: datetime | None
    is_active: bool


class APIKeyCreated(APIKeyResponse):
    api_key: str


class LogSourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    kind: str = "http"


class LogSourceResponse(ORMModel):
    id: UUID
    name: str
    kind: str
    created_at: datetime


class PipelineCreate(BaseModel):
    name: str
    description: str | None = None
    rules: dict[str, Any] = Field(default_factory=dict)
    is_enabled: bool = True


class PipelinePatch(BaseModel):
    name: str | None = None
    description: str | None = None
    rules: dict[str, Any] | None = None
    is_enabled: bool | None = None


class PipelineResponse(PipelineCreate, ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime


class LogIngestItem(BaseModel):
    source_id: UUID | None = None
    timestamp: datetime | None = None
    level: str | None = None
    service: str | None = None
    host: str | None = None
    message: str
    fields: dict[str, Any] = Field(default_factory=dict)


class LogIngestRequest(BaseModel):
    events: list[LogIngestItem] = Field(min_length=1, max_length=1000)


class LogSearchRequest(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    level: str | None = None
    service: str | None = None
    host: str | None = None
    text: str | None = None
    fields: dict[str, Any] = Field(default_factory=dict)
    limit: int = Field(default=100, ge=1, le=1000)


class NamedQueryCreate(BaseModel):
    name: str
    query: dict[str, Any] = Field(default_factory=dict)


class NamedQueryResponse(NamedQueryCreate, ORMModel):
    id: UUID
    created_at: datetime


class AlertRuleCreate(NamedQueryCreate):
    threshold: int = Field(default=1, ge=1)
    window_minutes: int = Field(default=5, ge=1)
    is_enabled: bool = True


class AlertRulePatch(BaseModel):
    name: str | None = None
    query: dict[str, Any] | None = None
    threshold: int | None = Field(default=None, ge=1)
    window_minutes: int | None = Field(default=None, ge=1)
    is_enabled: bool | None = None


class AlertRuleResponse(AlertRuleCreate, ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime


class DashboardCreate(BaseModel):
    name: str
    layout: dict[str, Any] = Field(default_factory=dict)


class DashboardResponse(DashboardCreate, ORMModel):
    id: UUID
    created_at: datetime


class AuditLogResponse(ORMModel):
    id: UUID
    actor_user_id: UUID | None
    action: str
    target_type: str | None
    target_id: str | None
    metadata_json: dict[str, Any]
    created_at: datetime
# Project version: LogForge V1.4
