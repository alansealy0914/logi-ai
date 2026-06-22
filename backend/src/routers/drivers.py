from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from ..core.auth import get_current_user
from ..services import driver_service

router = APIRouter(prefix="/drivers", tags=["Drivers"])


class DriverCreate(BaseModel):
    name: str
    license_number: str
    phone: Optional[str] = None
    status: str = "AVAILABLE"


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None


@router.get("/", response_model=List[dict])
async def list_drivers(user=Depends(get_current_user)):
    return await driver_service.list_drivers()


@router.get("/{driver_id}")
async def get_driver(driver_id: UUID, user=Depends(get_current_user)):
    driver = await driver_service.get_driver(driver_id)
    if not driver:
        raise HTTPException(404, "Driver not found")
    return driver


@router.post("/", response_model=dict)
async def create_driver(driver: DriverCreate, user=Depends(get_current_user)):
    return await driver_service.create_driver(driver.dict())


@router.put("/{driver_id}")
async def update_driver(driver_id: UUID, update: DriverUpdate, user=Depends(get_current_user)):
    await driver_service.update_driver(driver_id, update.dict())
    return {"msg": "Updated"}
