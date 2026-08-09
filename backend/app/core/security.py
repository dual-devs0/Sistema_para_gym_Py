import uuid
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=settings.bcrypt_rounds)

TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"
TOKEN_TYPE_PASSWORD_RESET = "password_reset"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _build_token(
    subject: str,
    token_type: str,
    expire_minutes: int | None = None,
    expire_days: int | None = None,
    gym_id: str | None = None,
) -> tuple[str, str, datetime]:
    jti = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    if expire_days:
        expire = now + timedelta(days=expire_days)
    else:
        expire = now + timedelta(minutes=expire_minutes or settings.access_token_expire_minutes)
    payload: dict = {
        "sub": subject,
        "jti": jti,
        "iat": now,
        "exp": expire,
        "type": token_type,
        "aud": "gympro-api",
    }
    if gym_id:
        payload["gym_id"] = gym_id
    return jwt.encode(payload, settings.secret_key, algorithm="HS256"), jti, expire


def create_access_token(subject: str, gym_id: str) -> str:
    token, _, _ = _build_token(subject, TOKEN_TYPE_ACCESS, gym_id=gym_id, expire_minutes=settings.access_token_expire_minutes)
    return token


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    return _build_token(subject, TOKEN_TYPE_REFRESH, expire_days=settings.refresh_token_expire_days)


def create_password_reset_token(subject: str) -> tuple[str, str, datetime]:
    return _build_token(subject, TOKEN_TYPE_PASSWORD_RESET, expire_minutes=settings.password_reset_token_expire_minutes)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"], audience="gympro-api")
    except jwt.ExpiredSignatureError:
        return {"error": "expired"}
    except InvalidTokenError:
        return {}
