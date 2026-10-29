from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, verify_institution_access, get_user_roles
from app.models.models import ApprovedIntake, ApprovedIntakeRevision, Course, Institution, User, AuditLog
from app.schemas.schemas import ApprovedIntakeCreate, ApprovedIntakeResponse, ApprovedIntakeRevisionResponse
from app.services.admission_monitoring_service import SmartAdmissionMonitoringService

router = APIRouter(prefix="/intake", tags=["Intake Management"])

def determine_intake_status(approved: int, actual: int) -> str:
    if approved <= 0:
        return "BELOW_CAPACITY"
    ratio = actual / approved
    if actual > approved:
        return "EXCESS_ENROLMENT"
    elif ratio >= 1.0:
        return "AT_CAPACITY"
    elif ratio >= 0.85:
        return "NEAR_CAPACITY"
    else:
        return "BELOW_CAPACITY"

@router.get("", response_model=List[ApprovedIntakeResponse], include_in_schema=False)
@router.get("/", response_model=List[ApprovedIntakeResponse])
def list_intakes(
    academic_year: Optional[str] = None,
    institution_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    query = db.query(ApprovedIntake, Course.course_name, Course.course_code).join(
        Course, ApprovedIntake.course_id == Course.id
    )

    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(ApprovedIntake.institution_id == current_user.institution_id)
        else:
            return []
    elif institution_id:
        query = query.filter(ApprovedIntake.institution_id == institution_id)

    if academic_year:
        query = query.filter(ApprovedIntake.academic_year == academic_year)

    results = query.all()
    output = []
    for intake, c_name, c_code in results:
        indicator = determine_intake_status(intake.approved_intake, intake.actual_enrolment)
        if status_filter and indicator != status_filter:
            continue
        output.append(ApprovedIntakeResponse(
            id=intake.id,
            institution_id=intake.institution_id,
            course_id=intake.course_id,
            course_name=c_name,
            course_code=c_code,
            academic_year=intake.academic_year,
            approved_intake=intake.approved_intake,
            supernumerary_quota=intake.supernumerary_quota,
            actual_enrolment=intake.actual_enrolment,
            supernumerary_enrolled=intake.supernumerary_enrolled,
            approval_order_ref=intake.approval_order_ref,
            effective_date=intake.effective_date,
            status_indicator=indicator
        ))
    return output

@router.post("", response_model=ApprovedIntakeResponse, include_in_schema=False)
@router.post("/", response_model=ApprovedIntakeResponse)
def set_approved_intake(
    intake_in: ApprovedIntakeCreate,
    institution_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)
    course = db.query(Course).filter(Course.id == intake_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(ApprovedIntake).filter(
        ApprovedIntake.institution_id == institution_id,
        ApprovedIntake.course_id == intake_in.course_id,
        ApprovedIntake.academic_year == intake_in.academic_year
    ).first()

    if existing:
        # Enforce Rule 9: Preserve change history
        SmartAdmissionMonitoringService.record_intake_revision(
            db=db,
            intake=existing,
            new_approved=intake_in.approved_intake,
            new_supernumerary=intake_in.supernumerary_quota,
            approval_reference=intake_in.approval_order_ref or "AICTE-REVISION-ORDER",
            reason=intake_in.revision_reason or "Intake Capacity Adjustment",
            user_id=current_user.id
        )
        target = existing
    else:
        target = ApprovedIntake(
            institution_id=institution_id,
            course_id=intake_in.course_id,
            academic_year=intake_in.academic_year,
            approved_intake=intake_in.approved_intake,
            supernumerary_quota=intake_in.supernumerary_quota,
            approval_order_ref=intake_in.approval_order_ref or "AICTE-INITIAL-SANCTION"
        )
        db.add(target)
        db.commit()
        db.refresh(target)

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=institution_id,
        action="INTAKE_CONFIGURED",
        resource_type="INTAKE",
        resource_id=target.id,
        details={
            "course_id": intake_in.course_id,
            "academic_year": intake_in.academic_year,
            "approved_intake": intake_in.approved_intake,
            "approval_ref": intake_in.approval_order_ref
        }
    ))
    db.commit()

    return ApprovedIntakeResponse(
        id=target.id,
        institution_id=target.institution_id,
        course_id=target.course_id,
        course_name=course.course_name,
        course_code=course.course_code,
        academic_year=target.academic_year,
        approved_intake=target.approved_intake,
        supernumerary_quota=target.supernumerary_quota,
        actual_enrolment=target.actual_enrolment,
        supernumerary_enrolled=target.supernumerary_enrolled,
        approval_order_ref=target.approval_order_ref,
        effective_date=target.effective_date,
        status_indicator=determine_intake_status(target.approved_intake, target.actual_enrolment)
    )

@router.get("/alerts")
def get_intake_alerts(
    academic_year: Optional[str] = None,
    institution_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns explainable intake discrepancy alerts using SmartAdmissionMonitoringService.
    """
    roles = get_user_roles(current_user, db)
    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        target_inst_id = current_user.institution_id
    else:
        target_inst_id = institution_id

    return SmartAdmissionMonitoringService.get_admission_alerts(
        db=db,
        institution_id=target_inst_id,
        academic_year=academic_year
    )

@router.get("/{intake_id}/history", response_model=List[ApprovedIntakeRevisionResponse])
def get_intake_history(
    intake_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full change history for an approved intake record (enforces Rule 9).
    """
    intake = db.query(ApprovedIntake).filter(ApprovedIntake.id == intake_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake record not found")

    verify_institution_access(intake.institution_id, current_user, db)

    revisions = db.query(ApprovedIntakeRevision).filter(
        ApprovedIntakeRevision.approved_intake_id == intake_id
    ).order_by(ApprovedIntakeRevision.created_at.desc()).all()

    return revisions

