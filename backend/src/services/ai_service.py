from fastapi import HTTPException
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import text
from ..core.database import AsyncSessionLocal
from ..rag.vector_store import VectorStore
from ..core.config import settings


def _get_llm() -> ChatGroq:
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith('<'):
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured. Add a valid key from console.groq.com to your .env file.")
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)


async def _delayed_shipments_context(session) -> str:
    result = await session.execute(text("""
        SELECT s.tracking_number, s.origin, s.destination, s.status,
               s.estimated_delivery, s.actual_delivery,
               d.name AS driver_name, t.truck_id, t.model AS truck_model
        FROM shipments s
        LEFT JOIN drivers d  ON d.id = s.driver_id
        LEFT JOIN trucks  t  ON t.id = s.vehicle_id
        WHERE s.status = 'IN_TRANSIT'
           OR (s.status = 'DELIVERED' AND s.actual_delivery > s.estimated_delivery)
        ORDER BY s.estimated_delivery ASC
        LIMIT 20
    """))
    rows = result.fetchall()
    if not rows:
        return "No delayed or at-risk shipments found."
    lines = []
    for r in rows:
        m = r._mapping
        lines.append(
            f"- {m['tracking_number']}: {m['origin']} → {m['destination']} | "
            f"Status: {m['status']} | "
            f"Est. delivery: {m['estimated_delivery']} | "
            f"Actual: {m['actual_delivery'] or 'N/A'} | "
            f"Driver: {m['driver_name'] or 'Unassigned'} | "
            f"Truck: {m['truck_id'] or 'N/A'} ({m['truck_model'] or 'N/A'})"
        )
    return "\n".join(lines)


async def ask_assistant(query: str) -> dict:
    llm = _get_llm()
    async with AsyncSessionLocal() as session:
        store = VectorStore(session)
        docs = await store.semantic_search(query)
        rag_context = "\n\n".join([
            f"Title: {row[0]}\nContent: {row[1][:700]}" for row in docs
        ])
        shipment_context = await _delayed_shipments_context(session)

        prompt = ChatPromptTemplate.from_template("""
You are a senior logistics operations expert for LogiAI.
Use the live shipment data and document context below to give accurate, professional answers.

## Live Shipment Data (In Transit / Delayed):
{shipment_context}

## Document Context:
{rag_context}

Question: {query}
""")
        chain = prompt | llm
        response = chain.invoke({"shipment_context": shipment_context, "rag_context": rag_context, "query": query})
        return {"answer": response.content, "sources": [row[0] for row in docs]}
