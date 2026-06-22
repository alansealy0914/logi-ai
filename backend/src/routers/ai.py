from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.auth import get_current_user
from ..core.database import get_db
from ..services import ai_service
from ..rag.vector_store import VectorStore

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class QueryRequest(BaseModel):
    query: str


class DocumentRequest(BaseModel):
    title: str
    content: str
    shipment_id: Optional[int] = None


@router.post("/assistant")
async def ai_assistant(req: QueryRequest, user=Depends(get_current_user)):
    try:
        return await ai_service.ask_assistant(req.query)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documents", status_code=201)
async def add_document(
    req: DocumentRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        store = VectorStore(db)
        await store.add_document(req.title, req.content, req.shipment_id)
        await db.commit()
        return {"message": "Document added to knowledge base", "title": req.title}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
