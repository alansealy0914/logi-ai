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
        import uuid as _uuid
        new_id = str(_uuid.uuid4())
        await session.execute(text("""
            INSERT INTO shipments (id, tracking_number, origin, destination, status, estimated_delivery, driver_id, vehicle_id, created_at)
            VALUES (:id, :tracking_number, :origin, :destination, :status, :estimated_delivery, :driver_id, :vehicle_id, now())
        """), {
            "id": new_id,
            "tracking_number": shipment.tracking_number,
            "origin": shipment.origin,
            "destination": shipment.destination,
            "status": shipment.status,
            "estimated_delivery": shipment.estimated_delivery,
            "driver_id": str(shipment.driver_id) if shipment.driver_id else None,
            "vehicle_id": str(shipment.vehicle_id) if shipment.vehicle_id else None,
        })
        await session.commit()
        return {"id": new_id, "tracking_number": shipment.tracking_number}

@router.get("/", response_model=List[dict])
async def list_shipments(user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT s.*, d.name AS driver_name, t.truck_id AS truck_ref
            FROM shipments s
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN trucks  t ON t.id = s.vehicle_id
            ORDER BY s.created_at DESC
        """))
        return [dict(row._mapping) for row in result.fetchall()]

@router.get("/{shipment_id}")
async def get_shipment(shipment_id: UUID, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT s.*, d.name AS driver_name, t.truck_id AS truck_ref, t.model AS truck_model
            FROM shipments s
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN trucks  t ON t.id = s.vehicle_id
            WHERE s.id = :id
        """), {"id": str(shipment_id)})
        shipment = result.fetchone()
        if not shipment:
            raise HTTPException(404)
        return dict(shipment._mapping)

@router.put("/{shipment_id}")
async def update_shipment(shipment_id: UUID, update: ShipmentUpdate, user=Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        await session.execute(text("""
            UPDATE shipments SET
                origin             = COALESCE(:origin, origin),
                destination        = COALESCE(:destination, destination),
                status             = COALESCE(:status, status),
                estimated_delivery = COALESCE(:estimated_delivery, estimated_delivery),
                actual_delivery    = COALESCE(:actual_delivery, actual_delivery),
                driver_id          = COALESCE(:driver_id, driver_id),
                vehicle_id         = COALESCE(:vehicle_id, vehicle_id)
            WHERE id = :id
        """), {
            "id": str(shipment_id),
            "origin": update.origin,
            "destination": update.destination,
            "status": update.status,
            "estimated_delivery": update.estimated_delivery,
            "actual_delivery": update.actual_delivery,
            "driver_id": str(update.driver_id) if update.driver_id else None,
            "vehicle_id": str(update.vehicle_id) if update.vehicle_id else None,
        })
        await session.commit()
        return {"msg": "Updated"}