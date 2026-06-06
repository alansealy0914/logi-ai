from sqlalchemy import text
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

class VectorStore:
    def __init__(self, session):
        self.session = session

    async def add_document(self, title: str, content: str, shipment_id=None):
        embedding = model.encode(content).tolist()
        await self.session.execute(text("""
            INSERT INTO documents (title, content, embedding, shipment_id, doc_type)
            VALUES (:title, :content, :embedding, :shipment_id, 'logistics')
        """), {"title": title, "content": content, "embedding": embedding, "shipment_id": shipment_id})

    async def semantic_search(self, query: str, limit: int = 5):
        embedding = model.encode(query).tolist()
        result = await self.session.execute(text("""
            SELECT title, content, 1 - (embedding <=> :emb::vector) as similarity
            FROM documents
            ORDER BY embedding <=> :emb::vector
            LIMIT :limit
        """), {"emb": embedding, "limit": limit})
        return result.fetchall()