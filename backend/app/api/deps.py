from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, verify_api_key
from app.db.session import get_db
from app.models import APIKey, User
from app.models.entities import now_utc

bearer = HTTPBearer(auto_error=False)


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
        organization_id = UUID(payload["org"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")
    user = db.scalar(select(User).where(User.id == user_id, User.organization_id == organization_id, User.is_active))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def ingest_organization_id(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> UUID:
    if not x_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-API-Key")
    candidates = db.scalars(select(APIKey).where(APIKey.is_active, APIKey.prefix == x_api_key[:10])).all()
    for api_key in candidates:
        if verify_api_key(x_api_key, api_key.key_hash):
            api_key.last_used_at = now_utc()
            db.commit()
            return api_key.organization_id
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
# Project version: LogForge V1.4








