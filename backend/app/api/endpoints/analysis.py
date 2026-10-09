from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.services import analysis_service
import traceback

router = APIRouter()

@router.get("/weekly")
async def get_weekly_analysis(
    source: str = "receipts",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return await analysis_service.generate_weekly_analysis(db, current_user, source)
    except Exception as e:
        with open('error.log', 'w') as f:
            f.write("ERROR IN GET_WEEKLY_ANALYSIS:\n")
            f.write(traceback.format_exc())
        raise e
