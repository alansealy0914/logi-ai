import asyncio
from sqlalchemy import text
from src.core.database import AsyncSessionLocal, engine, Base
from src.rag.vector_store import VectorStore
from src.models.shipment import Shipment
from sentence_transformers import SentenceTransformer
import src.models.shipment  # ensure models are loaded so metadata is populated

async def seed_data():
    # ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Sample shipments (use ORM so Python defaults like UUID are applied)
        s1 = Shipment(tracking_number="TRK12345", origin="Chicago, IL", destination="Dallas, TX", status="IN_TRANSIT")
        s2 = Shipment(tracking_number="TRK67890", origin="New York, NY", destination="Los Angeles, CA", status="PENDING")
        session.add_all([s1, s2])
        await session.flush()  # ensure IDs available for documents

        store = VectorStore(session)

        # Sample documents for semantic search
        docs = [
            ("Delayed Shipment Report", "Shipment TRK12345 was delayed due to weather in Chicago. New ETA: 2 days late."),
            ("Contract Chicago-Dallas", "Contract for 500 units temperature-sensitive goods. Must maintain 2-8°C."),
            ("Route Optimization Note", "Previous route Chicago to Dallas via I-55 had 18% fuel savings."),
        ]

        for title, content in docs:
            await store.add_document(title, content)

        await session.commit()
        print("✅ Seed data inserted with embeddings")

if __name__ == "__main__":
    asyncio.run(seed_data())