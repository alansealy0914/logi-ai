import asyncio
from sqlalchemy import text
from src.core.database import AsyncSessionLocal
from src.rag.vector_store import VectorStore
from sentence_transformers import SentenceTransformer

async def seed_data():
    async with AsyncSessionLocal() as session:
        # Sample shipments
        await session.execute(text("""
            INSERT INTO shipments (tracking_number, origin, destination, status, estimated_delivery)
            VALUES 
            ('TRK12345', 'Chicago, IL', 'Dallas, TX', 'IN_TRANSIT', NOW() + INTERVAL '3 days'),
            ('TRK67890', 'New York, NY', 'Los Angeles, CA', 'PENDING', NOW() + INTERVAL '5 days')
            ON CONFLICT DO NOTHING;
        """))
        
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