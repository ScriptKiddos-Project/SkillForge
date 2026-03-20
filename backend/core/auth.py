"""
core/auth.py

FIX APPLIED:
  Bug #6: EventSource (SSE) cannot send Authorization headers, so the token is
          passed as ?token= query param. The original get_current_user() only
          read the Bearer header and rejected SSE connections with 401.

          _decode_token is now exported (no underscore rename needed — analyze.py
          imports it directly for the SSE-specific dependency).
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import settings
from database import get_db

ALGORITHM = "HS256"

bearer  = HTTPBearer(auto_error=False)   # auto_error=False so SSE path can fall through
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password helpers ──────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────
def create_token(user_id: str) -> str:
    expire  = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises 401 on failure. Exported for SSE auth."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


# ── Standard dependency (Bearer header only) ──────────────────────────────────
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
):
    """
    Reads token from Authorization: Bearer <token> header.
    Used by all normal (non-SSE) endpoints.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = _decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject.")

    from models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user


# ── Authorization helper ──────────────────────────────────────────────────────
def verify_user_access(path_user_id: str, current_user) -> None:
    if str(current_user.id) != str(path_user_id):
        raise HTTPException(
            status_code=403,
            detail="Access denied. You can only access your own data."
        )
