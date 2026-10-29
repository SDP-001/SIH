from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import OfficerAssistantQuery, OfficerAssistantResponse
from app.services.officer_assistant_service import AICTEOfficerAssistantService

router = APIRouter(prefix="/assistant", tags=["AICTE Officer Assistant"])

@router.post("/query", response_model=OfficerAssistantResponse)
def ask_officer_assistant(
    query_in: OfficerAssistantQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Innovation 6: AICTE Officer Assistant Endpoint.
    Executes explainable structured queries on authenticated dashboard data with tenant isolation.
    """
    if not query_in.question or not query_in.question.strip():
        raise HTTPException(status_code=400, detail="Query question cannot be empty")

    res = AICTEOfficerAssistantService.process_query(
        db=db,
        current_user=current_user,
        question=query_in.question.strip(),
        academic_year=query_in.academic_year or "2024-2025",
        institution_id=query_in.institution_id
    )
    return res
