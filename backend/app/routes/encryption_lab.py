import base64
import binascii
import secrets

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.routes.auth import require_roles
from app.models import User

router = APIRouter(prefix="/api/encryption-lab", tags=["Encryption Lab"])


class EncryptRequest(BaseModel):
    plaintext: str = Field(min_length=1, max_length=10000)


class DecryptRequest(BaseModel):
    ciphertext: str = Field(min_length=1, max_length=30000)
    key: str = Field(min_length=1, max_length=256)
    nonce: str = Field(min_length=1, max_length=128)


def decode_b64(value: str, label: str) -> bytes:
    try:
        return base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=422, detail=f"{label} must be valid Base64")


@router.post("/encrypt")
def encrypt_text(data: EncryptRequest, _user: User = Depends(require_roles("Admin", "Learner"))):
    if not data.plaintext.strip():
        raise HTTPException(status_code=422, detail="Text to encrypt cannot be empty")
    key = AESGCM.generate_key(bit_length=256)
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(key).encrypt(nonce, data.plaintext.encode("utf-8"), None)
    return {
        "algorithm": "AES-256-GCM",
        "key": base64.b64encode(key).decode("ascii"),
        "nonce": base64.b64encode(nonce).decode("ascii"),
        "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
    }


@router.post("/decrypt")
def decrypt_text(data: DecryptRequest, _user: User = Depends(require_roles("Admin", "Learner"))):
    key = decode_b64(data.key, "Key")
    nonce = decode_b64(data.nonce, "Nonce")
    ciphertext = decode_b64(data.ciphertext, "Ciphertext")
    if len(key) != 32:
        raise HTTPException(status_code=422, detail="AES-256 keys must be 32 bytes")
    if len(nonce) != 12:
        raise HTTPException(status_code=422, detail="AES-GCM nonces must be 12 bytes")
    if len(ciphertext) < 16:
        raise HTTPException(status_code=422, detail="Ciphertext is incomplete")
    try:
        plaintext = AESGCM(key).decrypt(nonce, ciphertext, None)
        return {"plaintext": plaintext.decode("utf-8")}
    except (InvalidTag, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Decryption failed: key, nonce, or ciphertext is invalid")
