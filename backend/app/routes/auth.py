
import os
import json
import time
import hmac
import hashlib
import secrets
import base64

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Backend-only configuration. Environment variables supplied by the process take precedence.
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

SECRET_KEY = os.getenv(
    "CYBERSHIELD_SECRET_KEY",
    "development-only-change-this-secret-before-deployment"
)

security = HTTPBearer()


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=10, max_length=128)


class AdminRegisterRequest(RegisterRequest):
    invitation_code: str = Field(min_length=1, max_length=256)


class LoginRequest(BaseModel):
    email: str
    password: str


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    iterations = 310000

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        iterations
    )

    return (
        f"pbkdf2_sha256${iterations}$"
        f"{base64.urlsafe_b64encode(salt).decode()}$"
        f"{base64.urlsafe_b64encode(password_hash).decode()}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected_hash = stored_hash.split("$")

        if algorithm != "pbkdf2_sha256":
            return False

        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            base64.urlsafe_b64decode(salt),
            int(iterations)
        )

        expected = base64.urlsafe_b64decode(expected_hash)

        return hmac.compare_digest(actual_hash, expected)

    except (ValueError, TypeError):
        return False


def create_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "exp": int(time.time()) + 3600
    }

    encoded = base64.urlsafe_b64encode(
        json.dumps(payload).encode()
    ).decode().rstrip("=")

    signature = hmac.new(
        SECRET_KEY.encode(),
        encoded.encode(),
        hashlib.sha256
    ).digest()

    signed = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    return f"{encoded}.{signed}"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        encoded, signature = token.split(".")

        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            encoded.encode(),
            hashlib.sha256
        ).digest()

        supplied_signature = base64.urlsafe_b64decode(
            signature + "=" * (-len(signature) % 4)
        )

        if not hmac.compare_digest(
            expected_signature,
            supplied_signature
        ):
            raise ValueError("Invalid signature")

        payload = json.loads(
            base64.urlsafe_b64decode(
                encoded + "=" * (-len(encoded) % 4)
            )
        )

        if payload["exp"] < time.time():
            raise ValueError("Token expired")

        user = db.query(User).filter(
            User.id == int(payload["sub"])
        ).first()

        if not user or not user.is_active:
            raise ValueError("User unavailable")

        return user

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login session"
        )


def create_account(data: RegisterRequest, role: str, db: Session):
    email = data.email.strip().lower()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists"
        )

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Account created successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # The public registration endpoint never accepts or assigns elevated roles.
    return create_account(data, "Learner", db)


@router.post("/register-admin")
def register_admin(data: AdminRegisterRequest, db: Session = Depends(get_db)):
    configured_code = os.getenv("CYBERSHIELD_ADMIN_INVITATION_CODE", "")
    if not configured_code or not hmac.compare_digest(
        configured_code.encode(), data.invitation_code.encode()
    ):
        raise HTTPException(status_code=403, detail="A valid Admin invitation code is required")
    return create_account(data, "Admin", db)


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if (
        not user
        or not user.is_active
        or not verify_password(data.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }
def require_roles(*allowed_roles):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this module"
            )
        return user

    return role_checker
