import uuid
from uuid import UUID
from sqlalchemy import text
from ..core.database import AsyncSessionLocal


async def list_trucks() -> list:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT t.*, d.name AS driver_name
            FROM trucks t
            LEFT JOIN drivers d ON d.id = t.driver_id
            ORDER BY t.truck_id
        """))
        return [dict(row._mapping) for row in result.fetchall()]


async def get_truck(truck_uuid: UUID) -> dict | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("""
            SELECT t.*, d.name AS driver_name
            FROM trucks t
            LEFT JOIN drivers d ON d.id = t.driver_id
            WHERE t.id = :id
        """), {"id": str(truck_uuid)})
        row = result.fetchone()
        return dict(row._mapping) if row else None


async def create_truck(data: dict) -> dict:
    async with AsyncSessionLocal() as session:
        new_id = str(uuid.uuid4())
        payload = {k: str(v) if k == "driver_id" and v else v for k, v in data.items()}
        await session.execute(text("""
            INSERT INTO trucks (id, truck_id, plate, model, capacity_tons, status, driver_id)
            VALUES (:id, :truck_id, :plate, :model, :capacity_tons, :status, :driver_id)
        """), {"id": new_id, **payload})
        await session.commit()
        return {"id": new_id, "truck_id": data["truck_id"]}


async def update_truck(truck_uuid: UUID, data: dict) -> None:
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
            "truck_id": data.get("truck_id"),
            "plate": data.get("plate"),
            "model": data.get("model"),
            "capacity_tons": data.get("capacity_tons"),
            "status": data.get("status"),
            "driver_id": str(data["driver_id"]) if data.get("driver_id") else None,
        })
        await session.commit()
