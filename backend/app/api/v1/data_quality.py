from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, verify_institution_access
from app.models.models import User, Institution
from app.services.data_quality_service import InstitutionDataQualityService

router = APIRouter(prefix="/data-quality", tags=["Institution Data Quality"])

@router.get("/{institution_id}")
def get_institution_data_quality(
    institution_id: str,
    academic_year: str = Query("2024-2025"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Innovation 7: Returns transparent Data Quality Index (DQI) with component scores and mathematical formula.
    """
    verify_institution_access(institution_id, current_user, db)

    try:
        result = InstitutionDataQualityService.calculate_institution_dqi(
            db=db,
            institution_id=institution_id,
            academic_year=academic_year
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
