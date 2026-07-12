from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import current_user, ingest_organization_id
from app.core.security import create_access_token, generate_api_key, hash_password, verify_password
from app.db.session import get_db
from app.models import APIKey, AlertRule, AuditLog, Dashboard, LogSource, Organization, Pipeline, SavedSearch, User
from app.schemas import (
    APIKeyCreate,
    APIKeyCreated,
    APIKeyResponse,
    AlertRuleCreate,
    AlertRulePatch,
    AlertRuleResponse,
    AuditLogResponse,
    DashboardCreate,
    DashboardResponse,
    LogIngestRequest,
    LogSearchRequest,
    LogSourceCreate,
    LogSourceResponse,
    LoginRequest,
    MeResponse,
    NamedQueryCreate,
    NamedQueryResponse,
    PipelineCreate,
    PipelinePatch,
    PipelineResponse,
    RegisterRequest,
    TokenResponse,
)
from app.services.audit import write_audit
from app.services.clickhouse import ingest_events, search_events

router = APIRouter()


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_org = db.scalar(select(Organization).where(Organization.name == payload.organization_name))
    if existing_org:
        raise HTTPException(status_code=409, detail="Organization already exists")
    org = Organization(name=payload.organization_name)
    user = User(
        organization=org,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add_all([org, user])
    db.flush()
    write_audit(db, org.id, "auth.register", user.id, "user", str(user.id))
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id, org.id))


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower(), User.is_active))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    write_audit(db, user.organization_id, "auth.login", user.id, "user", str(user.id))
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id, user.organization_id))


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(current_user)):
    return user


@router.post("/api-keys", response_model=APIKeyCreated, status_code=201)
def create_api_key(payload: APIKeyCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    raw_key, key_hash = generate_api_key()
    api_key = APIKey(
        organization_id=user.organization_id,
        name=payload.name,
        key_hash=key_hash,
        prefix=raw_key[:10],
        created_by=user.id,
    )
    db.add(api_key)
    db.flush()
    write_audit(db, user.organization_id, "api_key.create", user.id, "api_key", str(api_key.id))
    db.commit()
    db.refresh(api_key)
    return APIKeyCreated(
        id=api_key.id,
        name=api_key.name,
        prefix=api_key.prefix,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        is_active=api_key.is_active,
        api_key=raw_key,
    )


@router.get("/api-keys", response_model=list[APIKeyResponse])
def list_api_keys(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(APIKey).where(APIKey.organization_id == user.organization_id).order_by(APIKey.created_at.desc())).all()


@router.post("/log-sources", response_model=LogSourceResponse, status_code=201)
def create_source(payload: LogSourceCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    source = LogSource(organization_id=user.organization_id, name=payload.name, kind=payload.kind)
    db.add(source)
    db.flush()
    write_audit(db, user.organization_id, "log_source.create", user.id, "log_source", str(source.id))
    db.commit()
    db.refresh(source)
    return source


@router.get("/log-sources", response_model=list[LogSourceResponse])
def list_sources(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(LogSource).where(LogSource.organization_id == user.organization_id).order_by(LogSource.created_at.desc())).all()


@router.post("/logs/ingest")
def ingest(payload: LogIngestRequest, organization_id=Depends(ingest_organization_id)):
    return {"ingested": ingest_events(organization_id, payload.events)}


@router.post("/logs/search")
def search_logs(payload: LogSearchRequest, user: User = Depends(current_user)):
    return {"events": search_events(user.organization_id, payload)}


@router.get("/pipelines", response_model=list[PipelineResponse])
def list_pipelines(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Pipeline).where(Pipeline.organization_id == user.organization_id).order_by(Pipeline.created_at.desc())).all()


@router.post("/pipelines", response_model=PipelineResponse, status_code=201)
def create_pipeline(payload: PipelineCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    pipeline = Pipeline(organization_id=user.organization_id, **payload.model_dump())
    db.add(pipeline)
    db.flush()
    write_audit(db, user.organization_id, "pipeline.create", user.id, "pipeline", str(pipeline.id))
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.patch("/pipelines/{pipeline_id}", response_model=PipelineResponse)
def patch_pipeline(pipeline_id: UUID, payload: PipelinePatch, user: User = Depends(current_user), db: Session = Depends(get_db)):
    pipeline = db.scalar(select(Pipeline).where(Pipeline.id == pipeline_id, Pipeline.organization_id == user.organization_id))
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(pipeline, key, value)
    write_audit(db, user.organization_id, "pipeline.update", user.id, "pipeline", str(pipeline.id))
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.delete("/pipelines/{pipeline_id}", status_code=204)
def delete_pipeline(pipeline_id: UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    pipeline = db.scalar(select(Pipeline).where(Pipeline.id == pipeline_id, Pipeline.organization_id == user.organization_id))
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    db.delete(pipeline)
    write_audit(db, user.organization_id, "pipeline.delete", user.id, "pipeline", str(pipeline.id))
    db.commit()


@router.get("/saved-searches", response_model=list[NamedQueryResponse])
def list_saved_searches(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(SavedSearch).where(SavedSearch.organization_id == user.organization_id).order_by(SavedSearch.created_at.desc())).all()


@router.post("/saved-searches", response_model=NamedQueryResponse, status_code=201)
def create_saved_search(payload: NamedQueryCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    item = SavedSearch(organization_id=user.organization_id, **payload.model_dump())
    db.add(item)
    write_audit(db, user.organization_id, "saved_search.create", user.id, "saved_search", None)
    db.commit()
    db.refresh(item)
    return item


@router.get("/alert-rules", response_model=list[AlertRuleResponse])
def list_alert_rules(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(AlertRule).where(AlertRule.organization_id == user.organization_id).order_by(AlertRule.created_at.desc())).all()


@router.post("/alert-rules", response_model=AlertRuleResponse, status_code=201)
def create_alert_rule(payload: AlertRuleCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    item = AlertRule(organization_id=user.organization_id, **payload.model_dump())
    db.add(item)
    write_audit(db, user.organization_id, "alert_rule.create", user.id, "alert_rule", None)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/alert-rules/{rule_id}", response_model=AlertRuleResponse)
def patch_alert_rule(rule_id: UUID, payload: AlertRulePatch, user: User = Depends(current_user), db: Session = Depends(get_db)):
    item = db.scalar(select(AlertRule).where(AlertRule.id == rule_id, AlertRule.organization_id == user.organization_id))
    if not item:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    write_audit(db, user.organization_id, "alert_rule.update", user.id, "alert_rule", str(item.id))
    db.commit()
    db.refresh(item)
    return item


@router.get("/dashboards", response_model=list[DashboardResponse])
def list_dashboards(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Dashboard).where(Dashboard.organization_id == user.organization_id).order_by(Dashboard.created_at.desc())).all()


@router.post("/dashboards", response_model=DashboardResponse, status_code=201)
def create_dashboard(payload: DashboardCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    item = Dashboard(organization_id=user.organization_id, **payload.model_dump())
    db.add(item)
    write_audit(db, user.organization_id, "dashboard.create", user.id, "dashboard", None)
    db.commit()
    db.refresh(item)
    return item


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def list_audit_logs(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(AuditLog).where(AuditLog.organization_id == user.organization_id).order_by(AuditLog.created_at.desc()).limit(200)).all()
# Project version: LogForge V1.4



