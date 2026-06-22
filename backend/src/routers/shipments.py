from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from ..core.auth import get_current_user
from ..services import shipment_service

router = APIRouter(prefix="/shipments", tags=["Shipments"])


class ShipmentCreate(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    estimated_delivery: Optional[datetime] = None
    status: str = "PENDING"
    driver_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None


class ShipmentUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    status: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    driver_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None


@router.get("/metrics")
async def get_metrics(user=Depends(get_current_user)):
    return await shipment_service.get_metrics()


@router.post("/", response_model=dict)
async def create_shipment(shipment: ShipmentCreate, user=Depends(get_current_user)):
    return await shipment_service.create_shipment(shipment.dict())


@router.get("/", response_model=List[dict])
async def list_shipments(user=Depends(get_current_user)):
    return await shipment_service.list_shipments()


@router.get("/{shipment_id}")
async def get_shipment(shipment_id: UUID, user=Depends(get_current_user)):
    shipment = await shipment_service.get_shipment(shipment_id)
    if not shipment:
        raise HTTPException(404)
    return shipment


@router.put("/{shipment_id}")
async def update_shipment(shipment_id: UUID, update: ShipmentUpdate, user=Depends(get_current_user)):
    await shipment_service.update_shipment(shipment_id, update.dict())
    return {"msg": "Updated"}
