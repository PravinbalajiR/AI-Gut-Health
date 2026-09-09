from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    query_id: Optional[int] = None
