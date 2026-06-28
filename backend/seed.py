import asyncio
import uuid
from datetime import timedelta, datetime as dt
from sqlalchemy import text
from src.core.database import AsyncSessionLocal, engine, Base
from src.rag.vector_store import VectorStore
import src.models.shipment
import src.models.fleet
import src.models.user  # ensure all tables registered

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        now = dt.utcnow()

        # --- Demo User ---
        from src.core.auth import get_password_hash
        await session.execute(text("""
            INSERT INTO users (id, email, hashed_password, full_name)
            VALUES (:id, :email, :hashed_password, :full_name)
            ON CONFLICT (email) DO NOTHING
        """), {"id": str(uuid.uuid4()), "email": "admin@logiai.com", "hashed_password": get_password_hash("admin123"), "full_name": "Admin User"})
        print("✅ Upserted demo user: admin@logiai.com / admin123")

        # --- Drivers ---
        drivers = [
            {"id": "d1000000-0000-0000-0000-000000000001", "name": "James Carter",  "license_number": "DL-100001", "phone": "555-101-0001", "status": "ON_TRIP"},
            {"id": "d1000000-0000-0000-0000-000000000002", "name": "Maria Lopez",   "license_number": "DL-100002", "phone": "555-101-0002", "status": "ON_TRIP"},
            {"id": "d1000000-0000-0000-0000-000000000003", "name": "David Kim",     "license_number": "DL-100003", "phone": "555-101-0003", "status": "AVAILABLE"},
            {"id": "d1000000-0000-0000-0000-000000000004", "name": "Sarah Johnson", "license_number": "DL-100004", "phone": "555-101-0004", "status": "ON_TRIP"},
            {"id": "d1000000-0000-0000-0000-000000000005", "name": "Carlos Rivera", "license_number": "DL-100005", "phone": "555-101-0005", "status": "OFF_DUTY"},
            {"id": "d1000000-0000-0000-0000-000000000006", "name": "Emily Chen",    "license_number": "DL-100006", "phone": "555-101-0006", "status": "AVAILABLE"},
        ]
        for d in drivers:
            await session.execute(text("""
                INSERT INTO drivers (id, name, license_number, phone, status)
                VALUES (:id, :name, :license_number, :phone, :status)
                ON CONFLICT (license_number) DO NOTHING
            """), d)
        print(f"✅ Upserted {len(drivers)} drivers.")

        # --- Trucks ---
        trucks = [
            {"id": "c2000000-0000-0000-0000-000000000001", "truck_id": "TRK-001", "plate": "IL-4521-A", "model": "Freightliner Cascadia", "capacity_tons": 22.0, "status": "IN_USE",      "driver_id": "d1000000-0000-0000-0000-000000000001"},
            {"id": "c2000000-0000-0000-0000-000000000002", "truck_id": "TRK-002", "plate": "NY-8833-B", "model": "Peterbilt 579",        "capacity_tons": 20.0, "status": "IN_USE",      "driver_id": "d1000000-0000-0000-0000-000000000002"},
            {"id": "c2000000-0000-0000-0000-000000000003", "truck_id": "TRK-003", "plate": "TX-2290-C", "model": "Kenworth T680",        "capacity_tons": 24.0, "status": "AVAILABLE",  "driver_id": None},
            {"id": "c2000000-0000-0000-0000-000000000004", "truck_id": "TRK-004", "plate": "WA-6671-D", "model": "Volvo VNL 860",        "capacity_tons": 21.5, "status": "IN_USE",      "driver_id": "d1000000-0000-0000-0000-000000000004"},
            {"id": "c2000000-0000-0000-0000-000000000005", "truck_id": "TRK-005", "plate": "CO-3345-E", "model": "Mack Anthem",          "capacity_tons": 23.0, "status": "MAINTENANCE", "driver_id": None},
            {"id": "c2000000-0000-0000-0000-000000000006", "truck_id": "TRK-006", "plate": "MA-9910-F", "model": "International LT",     "capacity_tons": 19.5, "status": "AVAILABLE",  "driver_id": "d1000000-0000-0000-0000-000000000006"},
        ]
        for t in trucks:
            await session.execute(text("""
                INSERT INTO trucks (id, truck_id, plate, model, capacity_tons, status, driver_id)
                VALUES (:id, :truck_id, :plate, :model, :capacity_tons, :status, :driver_id)
                ON CONFLICT (truck_id) DO NOTHING
            """), t)
        print(f"✅ Upserted {len(trucks)} trucks.")

        # --- Shipments ---
        shipments = [
            {"tracking_number": "TRK12345", "origin": "Chicago, IL",      "destination": "Dallas, TX",         "status": "IN_TRANSIT", "estimated_delivery": now + timedelta(days=2), "actual_delivery": None,                    "driver_id": "d1000000-0000-0000-0000-000000000001", "vehicle_id": "c2000000-0000-0000-0000-000000000001"},
            {"tracking_number": "TRK67890", "origin": "New York, NY",     "destination": "Los Angeles, CA",    "status": "PENDING",    "estimated_delivery": now + timedelta(days=5), "actual_delivery": None,                    "driver_id": None,                                   "vehicle_id": None},
            {"tracking_number": "TRK11111", "origin": "Houston, TX",      "destination": "Miami, FL",          "status": "DELIVERED",  "estimated_delivery": now - timedelta(days=3), "actual_delivery": now - timedelta(days=3), "driver_id": "d1000000-0000-0000-0000-000000000003", "vehicle_id": "c2000000-0000-0000-0000-000000000003"},
            {"tracking_number": "TRK22222", "origin": "Seattle, WA",      "destination": "Phoenix, AZ",        "status": "IN_TRANSIT", "estimated_delivery": now + timedelta(days=1), "actual_delivery": None,                    "driver_id": "d1000000-0000-0000-0000-000000000004", "vehicle_id": "c2000000-0000-0000-0000-000000000004"},
            {"tracking_number": "TRK33333", "origin": "Denver, CO",       "destination": "Atlanta, GA",        "status": "PENDING",    "estimated_delivery": now + timedelta(days=4), "actual_delivery": None,                    "driver_id": None,                                   "vehicle_id": None},
            {"tracking_number": "TRK44444", "origin": "Boston, MA",       "destination": "Chicago, IL",        "status": "DELIVERED",  "estimated_delivery": now - timedelta(days=7), "actual_delivery": now - timedelta(days=6), "driver_id": "d1000000-0000-0000-0000-000000000002", "vehicle_id": "c2000000-0000-0000-0000-000000000002"},
            {"tracking_number": "TRK55555", "origin": "Portland, OR",     "destination": "San Diego, CA",      "status": "CANCELLED",  "estimated_delivery": now - timedelta(days=1), "actual_delivery": None,                    "driver_id": None,                                   "vehicle_id": None},
            {"tracking_number": "TRK66666", "origin": "Minneapolis, MN",  "destination": "Nashville, TN",      "status": "DELIVERED",  "estimated_delivery": now - timedelta(days=2), "actual_delivery": now - timedelta(days=2), "driver_id": "d1000000-0000-0000-0000-000000000006", "vehicle_id": "c2000000-0000-0000-0000-000000000006"},
            {"tracking_number": "TRK77777", "origin": "Las Vegas, NV",    "destination": "Salt Lake City, UT", "status": "IN_TRANSIT", "estimated_delivery": now + timedelta(days=1), "actual_delivery": None,                    "driver_id": "d1000000-0000-0000-0000-000000000001", "vehicle_id": "c2000000-0000-0000-0000-000000000001"},
            {"tracking_number": "TRK88888", "origin": "Detroit, MI",      "destination": "Columbus, OH",       "status": "PENDING",    "estimated_delivery": now + timedelta(days=3), "actual_delivery": None,                    "driver_id": None,                                   "vehicle_id": None},
            {"tracking_number": "TRK99999", "origin": "Philadelphia, PA", "destination": "Washington, DC",     "status": "DELIVERED",  "estimated_delivery": now - timedelta(days=5), "actual_delivery": now - timedelta(days=4), "driver_id": "d1000000-0000-0000-0000-000000000005", "vehicle_id": "c2000000-0000-0000-0000-000000000005"},
            {"tracking_number": "TRK10101", "origin": "Austin, TX",       "destination": "Oklahoma City, OK",  "status": "CANCELLED",  "estimated_delivery": now - timedelta(days=2), "actual_delivery": None,                    "driver_id": None,                                   "vehicle_id": None},
        ]
        for s in shipments:
            await session.execute(text("""
                INSERT INTO shipments (id, tracking_number, origin, destination, status, estimated_delivery, actual_delivery, driver_id, vehicle_id, created_at)
                VALUES (:id, :tracking_number, :origin, :destination, :status, :estimated_delivery, :actual_delivery, :driver_id, :vehicle_id, :created_at)
                ON CONFLICT (tracking_number) DO NOTHING
            """), {"id": str(uuid.uuid4()), "created_at": now, **s})
        print(f"✅ Upserted {len(shipments)} shipments.")

        # --- Documents ---
        store = VectorStore(session)
        for title, content in [
            ("Delayed Shipment Report", "Shipment TRK12345 was delayed due to weather in Chicago. New ETA: 2 days late."),
            ("Contract Chicago-Dallas", "Contract for 500 units temperature-sensitive goods. Must maintain 2-8°C."),
            ("Route Optimization Note", "Previous route Chicago to Dallas via I-55 had 18% fuel savings."),
        ]:
            await store.add_document(title, content)

        await session.commit()
        print("✅ Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
