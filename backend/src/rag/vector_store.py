from sentence_transformers import SentenceTransformer
from src.models.shipment import Document

model = SentenceTransformer('all-MiniLM-L6-v2')

class VectorStore:
    def __init__(self, session):
        self.session = session

    async def add_document(self, title: str, content: str, shipment_id=None):
        embedding = model.encode(content).tolist()
        doc = Document(title=title, content=content, embedding=embedding, shipment_id=shipment_id, doc_type='logistics')
        self.session.add(doc)

    async def semantic_search(self, query: str, limit: int = 5):
        embedding = model.encode(query).tolist()
        # build an explicit vector literal to avoid asyncpg positional/cast issues
        from sqlalchemy import text
        emb_literal = ",".join(str(float(x)) for x in embedding)
        sql = f"""
            SELECT title, content, 1 - (embedding <=> ARRAY[{emb_literal}]::vector) as similarity
            FROM documents
            ORDER BY embedding <=> ARRAY[{emb_literal}]::vector
            LIMIT {int(limit)}
        """
        result = await self.session.execute(text(sql))
        return result.fetchall()