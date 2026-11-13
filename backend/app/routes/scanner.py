
from fastapi import APIRouter
import socket

router = APIRouter(
    prefix="/api/scanner",
    tags=["Network Scanner"]
)

@router.get("/hostname")
def get_hostname():
    hostname = socket.gethostname()

    try:
        ip_address = socket.gethostbyname(hostname)
    except socket.gaierror:
        ip_address = "Unavailable"

    return {
        "hostname": hostname,
        "ip_address": ip_address,
        "status": "success"
    }
