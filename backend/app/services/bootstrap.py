from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Organization, User
from app.services.audit import write_audit


def bootstrap_admin() -> None:
    if not settings.bootstrap_admin_email or not settings.bootstrap_admin_password:
        return

    with SessionLocal() as db:
        org = db.scalar(select(Organization).where(Organization.name == settings.bootstrap_admin_org))
        if not org:
            org = Organization(name=settings.bootstrap_admin_org)
            db.add(org)
            db.flush()

        user = db.scalar(
            select(User).where(
                User.organization_id == org.id,
                User.email == settings.bootstrap_admin_email.lower(),
            )
        )
        if user:
            changed = False
            if not user.is_admin:
                user.is_admin = True
                changed = True
            if not user.is_active:
                user.is_active = True
                changed = True
            if changed:
                write_audit(db, org.id, "bootstrap.admin_update", user.id, "user", str(user.id))
                db.commit()
            return

        user = User(
            organization_id=org.id,
            email=settings.bootstrap_admin_email.lower(),
            password_hash=hash_password(settings.bootstrap_admin_password),
            full_name=settings.bootstrap_admin_name,
            is_admin=True,
            is_active=True,
        )
        db.add(user)
        db.flush()
        write_audit(db, org.id, "bootstrap.admin_create", user.id, "user", str(user.id))
        db.commit()
# Project version: LogForge V1.4

