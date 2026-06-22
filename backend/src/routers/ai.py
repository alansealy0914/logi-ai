from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..core.auth import get_current_user
from ..services import ai_service

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class QueryRequest(BaseModel):
    query: str


@router.post("/assistant")
async def ai_assistant(req: QueryRequest, user=Depends(get_current_user)):
    try:
        return await ai_service.ask_assistant(req.query)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
