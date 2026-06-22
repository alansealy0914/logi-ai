from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from ..core.auth import get_current_user
from ..services import truck_service

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
    return await truck_service.list_trucks()


@router.get("/{truck_uuid}")
async def get_truck(truck_uuid: UUID, user=Depends(get_current_user)):
    truck = await truck_service.get_truck(truck_uuid)
    if not truck:
        raise HTTPException(404, "Truck not found")
    return truck


@router.post("/", response_model=dict)
async def create_truck(truck: TruckCreate, user=Depends(get_current_user)):
    return await truck_service.create_truck(truck.dict())


@router.put("/{truck_uuid}")
async def update_truck(truck_uuid: UUID, update: TruckUpdate, user=Depends(get_current_user)):
    await truck_service.update_truck(truck_uuid, update.dict())
    return {"msg": "Updated"}
