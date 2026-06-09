from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from sqlalchemy import text
from ..core.database import AsyncSessionLocal
from ..core.auth import get_current_user
import uuid

router = APIRouter(prefix="/trucks", tags=["Trucks"])

class TruckCreate(BaseModel):
    truck_id: str
    plate: str
    model: str
    capacity_tons: float
    status: str = "AVAILABLE"
    driver_id: Optional[UUID] = None

class TruckUpdate(BaseModel):
    truck_id: Optional[str] = None
    plate: Optional[str] = None
    model: Optional[str] = None
    capacity_tons: Optional[float] = None
    status: Optional[str] = None
    driver_id: Optional[UUID] = None

@router.get("/", response_model=List[dict])
async def list_trucks(user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT t.*, d.name AS driver_name
            FROM trucks t
            LEFT JOIN drivers d ON d.id = t.driver_id
            ORDER BY t.truck_id
        """))
        return [dict(row._mapping) for row in result.fetchall()]

@router.get("/{truck_uuid}")
async def get_truck(truck_uuid: UUID, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("""
                SELECT t.*, d.name AS driver_name
                FROM trucks t
                LEFT JOIN drivers d ON d.id = t.driver_id
                WHERE t.id = :id
            """), {"id": str(truck_uuid)}
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(404, "Truck not found")
        return dict(row._mapping)

@router.post("/", response_model=dict)
async def create_truck(truck: TruckCreate, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        new_id = str(uuid.uuid4())
        await session.execute(text("""
            INSERT INTO trucks (id, truck_id, plate, model, capacity_tons, status, driver_id)
            VALUES (:id, :truck_id, :plate, :model, :capacity_tons, :status, :driver_id)
        """), {"id": new_id, **{k: str(v) if k == "driver_id" and v else v for k, v in truck.dict().items()}})
        await session.commit()
        return {"id": new_id, "truck_id": truck.truck_id}

@router.put("/{truck_uuid}")
async def update_truck(truck_uuid: UUID, update: TruckUpdate, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        await session.execute(text("""
            UPDATE trucks SET
                truck_id      = COALESCE(:truck_id, truck_id),
                plate         = COALESCE(:plate, plate),
                model         = COALESCE(:model, model),
                capacity_tons = COALESCE(:capacity_tons, capacity_tons),
                status        = COALESCE(:status, status),
                driver_id     = COALESCE(:driver_id, driver_id)
            WHERE id = :id
        """), {
            "id": str(truck_uuid),
            "truck_id": update.truck_id,
            "plate": update.plate,
            "model": update.model,
            "capacity_tons": update.capacity_tons,
            "status": update.status,
            "driver_id": str(update.driver_id) if update.driver_id else None,
        })
        await session.commit()
        return {"msg": "Updated"}
