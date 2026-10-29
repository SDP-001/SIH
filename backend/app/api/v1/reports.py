import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, get_user_roles, verify_institution_access
from app.models.models import Institution, Course, ApprovedIntake, Student, DuplicateAlert, User, AuditLog
from app.services.report_generator_service import RegulatoryReportGeneratorService

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/types")
def get_available_report_types():
    """
    Returns all 8 available regulatory reporting schemas.
    """
    return [
        {"id": k, "title": v} for k, v in RegulatoryReportGeneratorService.REPORT_TYPES.items()
    ]

@router.get("/generate")
def generate_regulatory_report(
    report_type: str = Query("institution_enrolment"),
    academic_year: Optional[str] = Query("2024-2025"),
    institution_id: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates structured regulatory report rows for web display or print preview.
    """
    roles = get_user_roles(current_user, db)
    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        target_inst = current_user.institution_id
    else:
        target_inst = institution_id

    rows = RegulatoryReportGeneratorService.generate_report_data(
        db=db,
        report_type=report_type,
        institution_id=target_inst,
        academic_year=academic_year,
        state=state
    )

    return {
        "report_type": report_type,
        "report_title": RegulatoryReportGeneratorService.REPORT_TYPES.get(report_type, "Regulatory Report"),
        "academic_year": academic_year,
        "total_records": len(rows),
        "data": rows
    }

@router.get("/enrolment")
def get_enrolment_report(
    state: Optional[str] = None,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Backwards-compatible course enrolment summary endpoint.
    """
    roles = get_user_roles(current_user, db)
    target_inst = current_user.institution_id if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles else None

    return RegulatoryReportGeneratorService.generate_report_data(
        db=db,
        report_type="course_enrolment",
        institution_id=target_inst,
        academic_year=academic_year or "2024-2025",
        state=state
    )

@router.get("/export/csv")
def export_report_csv(
    report_type: str = Query("institution_enrolment"),
    academic_year: Optional[str] = Query("2024-2025"),
    institution_id: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    target_inst = current_user.institution_id if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles else institution_id

    rows = RegulatoryReportGeneratorService.generate_report_data(
        db=db,
        report_type=report_type,
        institution_id=target_inst,
        academic_year=academic_year,
        state=state
    )

    csv_data = RegulatoryReportGeneratorService.export_csv(rows)

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=target_inst,
        action="REPORT_EXPORT_CSV",
        resource_type="REPORT",
        resource_id=report_type,
        details={"academic_year": academic_year, "state": state, "rows": len(rows)}
    ))
    db.commit()

    filename = f"aicte_{report_type}_{academic_year or 'all'}.csv"
    response = Response(content=csv_data, media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response

@router.get("/export/xlsx")
def export_report_xlsx(
    report_type: str = Query("institution_enrolment"),
    academic_year: Optional[str] = Query("2024-2025"),
    institution_id: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    target_inst = current_user.institution_id if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles else institution_id

    rows = RegulatoryReportGeneratorService.generate_report_data(
        db=db,
        report_type=report_type,
        institution_id=target_inst,
        academic_year=academic_year,
        state=state
    )

    xlsx_bytes = RegulatoryReportGeneratorService.export_xlsx(rows, sheet_name=report_type)

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=target_inst,
        action="REPORT_EXPORT_XLSX",
        resource_type="REPORT",
        resource_id=report_type,
        details={"academic_year": academic_year, "state": state, "rows": len(rows)}
    ))
    db.commit()

    filename = f"aicte_{report_type}_{academic_year or 'all'}.xlsx"
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

