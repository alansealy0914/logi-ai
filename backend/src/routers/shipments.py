from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy import text
from ..core.database import AsyncSessionLocal
from ..models.shipment import Shipment
from ..core.auth import get_current_user

router = APIRouter(prefix="/shipments", tags=["Shipments"])

class ShipmentCreate(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    estimated_delivery: Optional[datetime]
    status: str = "PENDING"

class ShipmentUpdate(BaseModel):
    status: Optional[str]
    actual_delivery: Optional[datetime]

@router.get("/metrics")
async def get_metrics(user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') AS in_transit,
                COUNT(*) FILTER (WHERE status = 'DELIVERED')  AS delivered,
                COUNT(*) FILTER (WHERE status = 'PENDING')    AS pending,
                COUNT(*) FILTER (WHERE status = 'CANCELLED')  AS cancelled,
                COUNT(*) FILTER (WHERE status = 'DELIVERED' AND actual_delivery <= estimated_delivery) AS on_time,
                COUNT(*) FILTER (WHERE status = 'DELIVERED' AND actual_delivery > estimated_delivery)  AS delayed
            FROM shipments
        """))
        row = result.fetchone()
        return dict(row._mapping)

@router.post("/", response_model=dict)
async def create_shipment(shipment: ShipmentCreate, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        new_shipment = Shipment(**shipment.dict())
        session.add(new_shipment)
        await session.commit()
        return {"id": str(new_shipment.id), "tracking_number": new_shipment.tracking_number}

@router.get("/", response_model=List[dict])
async def list_shipments(user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute("SELECT * FROM shipments")
        return [dict(row) for row in result.fetchall()]

@router.get("/{shipment_id}")
async def get_shipment(shipment_id: UUID, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute("SELECT * FROM shipments WHERE id = :id", {"id": shipment_id})
        shipment = result.fetchone()
        if not shipment:
            raise HTTPException(404)
        return dict(shipment)

@router.put("/{shipment_id}")
async def update_shipment(shipment_id: UUID, update: ShipmentUpdate, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        await session.execute("""
            UPDATE shipments SET status = COALESCE(:status, status),
            actual_delivery = COALESCE(:actual_delivery, actual_delivery)
            WHERE id = :id
        """, {"id": shipment_id, "status": update.status, "actual_delivery": update.actual_delivery})
        await session.commit()
        return {"msg": "Updated"}