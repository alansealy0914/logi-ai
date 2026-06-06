from fastapi import APIRouter
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from ..core.database import AsyncSessionLocal
from ..rag.vector_store import VectorStore

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

class QueryRequest(BaseModel):
    query: str

llm = ChatGroq(model="llama3-70b-8192", temperature=0.3)

@router.post("/assistant")
async def ai_assistant(req: QueryRequest):
    async with AsyncSessionLocal() as session:
        store = VectorStore(session)
        docs = await store.semantic_search(req.query)
        context = "\n\n".join([f"Title: {d.title}\nContent: {d.content[:700]}" for d in docs])
        
        prompt = ChatPromptTemplate.from_template("""
        You are a senior logistics operations expert.
        Use the provided context to give accurate, professional answers.
        
        Context:
        {context}
        
        Question: {query}
        """)
        
        chain = prompt | llm
        response = chain.invoke({"context": context, "query": req.query})
        return {"answer": response.content, "sources": [d.title for d in docs]}