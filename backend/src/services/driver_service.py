import uuid
from uuid import UUID
from sqlalchemy import text
from ..core.database import AsyncSessionLocal


async def list_drivers() -> list:
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT * FROM drivers ORDER BY name"))
        return [dict(row._mapping) for row in result.fetchall()]


async def get_driver(driver_id: UUID) -> dict | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT * FROM drivers WHERE id = :id"), {"id": str(driver_id)}
        )
        row = result.fetchone()
        return dict(row._mapping) if row else None


async def create_driver(data: dict) -> dict:
    async with AsyncSessionLocal() as session:
        new_id = str(uuid.uuid4())
        await session.execute(text("""
            INSERT INTO drivers (id, name, license_number, phone, status)
            VALUES (:id, :name, :license_number, :phone, :status)
        """), {"id": new_id, **data})
        await session.commit()
        return {"id": new_id, "name": data["name"]}


async def update_driver(driver_id: UUID, data: dict) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(text("""
            UPDATE drivers SET
                name           = COALESCE(:name, name),
                license_number = COALESCE(:license_number, license_number),
                status         = COALESCE(:status, status),
                phone          = COALESCE(:phone, phone)
            WHERE id = :id
        """), {"id": str(driver_id), **data})
        await session.commit()
