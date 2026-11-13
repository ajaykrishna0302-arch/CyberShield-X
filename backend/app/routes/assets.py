import socket
import platform
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, IPvAnyAddress
from typing import Optional

from app.database import get_db
from app.models import Asset

router = APIRouter(
    prefix="/api/assets",
    tags=["Network Asset Inventory"]
)


class AssetCreate(BaseModel):
    device_name: str = Field(min_length=1, max_length=100)
    ip_address: IPvAnyAddress
    device_type: str = Field(min_length=1, max_length=50)
    description: Optional[str] = Field(default=None, max_length=250)


@router.post("/")
def add_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    new_asset = Asset(
        device_name=asset.device_name,
        ip_address=str(asset.ip_address),
        device_type=asset.device_type,
        description=asset.description
    )

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return {
        "message": "Asset registered successfully",
        "asset": {
            "id": new_asset.id,
            "device_name": new_asset.device_name,
            "ip_address": new_asset.ip_address,
            "device_type": new_asset.device_type,
            "description": new_asset.description,
            "status": new_asset.status
        }
    }


@router.get("/")
def get_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).order_by(Asset.id.desc()).all()

    return [
        {
            "id": asset.id,
            "device_name": asset.device_name,
            "ip_address": asset.ip_address,
            "device_type": asset.device_type,
            "description": asset.description,
            "status": asset.status
        }
        for asset in assets
    ]
# Update an existing asset
@router.put("/{asset_id}")
def update_asset(
    asset_id: int,
    asset: AssetCreate,
    db: Session = Depends(get_db)
):
    existing_asset = db.query(Asset).filter(
        Asset.id == asset_id
    ).first()

    if not existing_asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    existing_asset.device_name = asset.device_name
    existing_asset.ip_address = str(asset.ip_address)
    existing_asset.device_type = asset.device_type
    existing_asset.description = asset.description

    db.commit()
    db.refresh(existing_asset)

    return {
        "message": "Asset updated successfully",
        "asset": {
            "id": existing_asset.id,
            "device_name": existing_asset.device_name,
            "ip_address": existing_asset.ip_address,
            "device_type": existing_asset.device_type,
            "description": existing_asset.description,
            "status": existing_asset.status
        }
    }


# Delete an existing asset
@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db)
):
    existing_asset = db.query(Asset).filter(
        Asset.id == asset_id
    ).first()

    if not existing_asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    db.delete(existing_asset)
    db.commit()

    return {
        "message": "Asset deleted successfully"
    }
# Automatically detect the current computer
@router.get("/discover")
def discover_device():

    try:
        hostname = socket.gethostname()

        local_ip = socket.gethostbyname(hostname)

        operating_system = platform.system()

        return {
            "device_name": hostname,
            "ip_address": local_ip,
            "device_type": operating_system,
            "description": "Automatically discovered device",
            "status": "Discovered"
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Device discovery failed: {str(error)}"
        )
