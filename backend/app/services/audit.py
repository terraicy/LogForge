from uuid import UUID

from sqlalchemy.orm import Session

from app.models import AuditLog


def write_audit(
    db: Session,
    organization_id: UUID,
    action: str,
    actor_user_id: UUID | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=metadata or {},
        )
    )
# Project version: LogForge V1.4

