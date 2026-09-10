from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services import ai_assistant_service

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    answer = await ai_assistant_service.query_assistant(db, current_user, request.question)
    return ChatResponse(answer=answer)
