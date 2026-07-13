from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: UUID, organization_id: UUID) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "org": str(organization_id), "exp": expires}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def generate_api_key() -> tuple[str, str]:
    raw = f"lf_{token_urlsafe(32)}"
    return raw, pwd_context.hash(raw)


def verify_api_key(raw_key: str, key_hash: str) -> bool:
    return pwd_context.verify(raw_key, key_hash)
# Project version: LogForge V1.4




