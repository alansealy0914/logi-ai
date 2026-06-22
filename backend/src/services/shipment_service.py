import uuid
from uuid import UUID
from sqlalchemy import text
from ..core.database import AsyncSessionLocal


async def get_metrics() -> dict:
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
        return dict(result.fetchone()._mapping)


async def create_shipment(data: dict) -> dict:
    async with AsyncSessionLocal() as session:
        new_id = str(uuid.uuid4())
        await session.execute(text("""
            INSERT INTO shipments (id, tracking_number, origin, destination, status, estimated_delivery, driver_id, vehicle_id, created_at)
            VALUES (:id, :tracking_number, :origin, :destination, :status, :estimated_delivery, :driver_id, :vehicle_id, now())
        """), {
            "id": new_id,
            "tracking_number": data["tracking_number"],
            "origin": data["origin"],
            "destination": data["destination"],
            "status": data.get("status", "PENDING"),
            "estimated_delivery": data.get("estimated_delivery"),
            "driver_id": str(data["driver_id"]) if data.get("driver_id") else None,
            "vehicle_id": str(data["vehicle_id"]) if data.get("vehicle_id") else None,
        })
        await session.commit()
        return {"id": new_id, "tracking_number": data["tracking_number"]}


async def list_shipments() -> list:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT s.*, d.name AS driver_name, t.truck_id AS truck_ref
            FROM shipments s
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN trucks  t ON t.id = s.vehicle_id
            ORDER BY s.created_at DESC
        """))
        return [dict(row._mapping) for row in result.fetchall()]


async def get_shipment(shipment_id: UUID) -> dict | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT s.*, d.name AS driver_name, t.truck_id AS truck_ref, t.model AS truck_model
            FROM shipments s
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN trucks  t ON t.id = s.vehicle_id
            WHERE s.id = :id
        """), {"id": str(shipment_id)})
        row = result.fetchone()
        return dict(row._mapping) if row else None


async def update_shipment(shipment_id: UUID, data: dict) -> None:
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
            "origin": data.get("origin"),
            "destination": data.get("destination"),
            "status": data.get("status"),
            "estimated_delivery": data.get("estimated_delivery"),
            "actual_delivery": data.get("actual_delivery"),
            "driver_id": str(data["driver_id"]) if data.get("driver_id") else None,
            "vehicle_id": str(data["vehicle_id"]) if data.get("vehicle_id") else None,
        })
        await session.commit()
