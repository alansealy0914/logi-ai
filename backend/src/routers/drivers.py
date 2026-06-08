from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from sqlalchemy import text
from ..core.database import AsyncSessionLocal
from ..core.auth import get_current_user
import uuid

router = APIRouter(prefix="/drivers", tags=["Drivers"])

class DriverCreate(BaseModel):
    name: str
    license_number: str
    phone: Optional[str] = None
    status: str = "AVAILABLE"

class DriverUpdate(BaseModel):
    status: Optional[str] = None
    phone: Optional[str] = None

@router.get("/", response_model=List[dict])
async def list_drivers(user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT * FROM drivers ORDER BY name"))
        return [dict(row._mapping) for row in result.fetchall()]

@router.get("/{driver_id}")
async def get_driver(driver_id: UUID, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT * FROM drivers WHERE id = :id"), {"id": str(driver_id)}
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(404, "Driver not found")
        return dict(row._mapping)

@router.post("/", response_model=dict)
async def create_driver(driver: DriverCreate, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        new_id = str(uuid.uuid4())
        await session.execute(text("""
            INSERT INTO drivers (id, name, license_number, phone, status)
            VALUES (:id, :name, :license_number, :phone, :status)
        """), {"id": new_id, **driver.dict()})
        await session.commit()
        return {"id": new_id, "name": driver.name}

@router.put("/{driver_id}")
async def update_driver(driver_id: UUID, update: DriverUpdate, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        await session.execute(text("""
            UPDATE drivers SET
                status = COALESCE(:status, status),
                phone  = COALESCE(:phone, phone)
            WHERE id = :id
        """), {"id": str(driver_id), "status": update.status, "phone": update.phone})
        await session.commit()
        return {"msg": "Updated"}
