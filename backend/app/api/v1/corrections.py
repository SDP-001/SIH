from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, get_user_roles, verify_institution_access
from app.models.models import CorrectionRequest, Student, Institution, User, AuditLog
from app.schemas.schemas import CorrectionRequestCreate, CorrectionRequestResolve, CorrectionRequestResponse

router = APIRouter(prefix="/corrections", tags=["Correction Requests"])

@router.post("", response_model=CorrectionRequestResponse, include_in_schema=False)
@router.post("/", response_model=CorrectionRequestResponse)
def submit_correction_request(
    req_in: CorrectionRequestCreate,
    institution_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits an institutional correction request for an inaccurate or flagged student record.
    """
    verify_institution_access(institution_id, current_user, db)

    student = db.query(Student).filter(Student.id == req_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    # Get current field value
    current_val = getattr(student, req_in.field_name, None)
    if current_val is not None:
        current_val = str(current_val)

    corr = CorrectionRequest(
        institution_id=institution_id,
        student_id=student.id,
        field_name=req_in.field_name,
        current_value=current_val,
        requested_value=req_in.requested_value,
        justification=req_in.justification,
        supporting_doc_ref=req_in.supporting_doc_ref,
        status="PENDING"
    )
    db.add(corr)

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=institution_id,
        action="CORRECTION_REQUESTED",
        resource_type="CORRECTION",
        resource_id=corr.id,
        details={
            "field": req_in.field_name,
            "old_val": current_val,
            "new_val": req_in.requested_value
        }
    ))
    db.commit()
    db.refresh(corr)

    return CorrectionRequestResponse(
        id=corr.id,
        institution_id=corr.institution_id,
        student_id=corr.student_id,
        student_name=student.student_name,
        institution_reg_num=student.institution_reg_num,
        field_name=corr.field_name,
        current_value=corr.current_value,
        requested_value=corr.requested_value,
        justification=corr.justification,
        supporting_doc_ref=corr.supporting_doc_ref,
        status=corr.status,
        reviewer_name=None,
        review_notes=None,
        created_at=corr.created_at,
        resolved_at=None
    )

@router.get("", response_model=List[CorrectionRequestResponse], include_in_schema=False)
@router.get("/", response_model=List[CorrectionRequestResponse])
def list_corrections(
    status_filter: Optional[str] = None,
    institution_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    query = db.query(CorrectionRequest, Student.student_name, Student.institution_reg_num, User.full_name).join(
        Student, CorrectionRequest.student_id == Student.id
    ).outerjoin(
        User, CorrectionRequest.reviewer_id == User.id
    )

    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(CorrectionRequest.institution_id == current_user.institution_id)
        else:
            return []
    elif institution_id:
        query = query.filter(CorrectionRequest.institution_id == institution_id)

    if status_filter:
        query = query.filter(CorrectionRequest.status == status_filter)

    rows = query.order_by(CorrectionRequest.created_at.desc()).all()
    output = []
    for c, s_name, s_reg, r_name in rows:
        output.append(CorrectionRequestResponse(
            id=c.id,
            institution_id=c.institution_id,
            student_id=c.student_id,
            student_name=s_name,
            institution_reg_num=s_reg,
            field_name=c.field_name,
            current_value=c.current_value,
            requested_value=c.requested_value,
            justification=c.justification,
            supporting_doc_ref=c.supporting_doc_ref,
            status=c.status,
            reviewer_name=r_name,
            review_notes=c.review_notes,
            created_at=c.created_at,
            resolved_at=c.resolved_at
        ))
    return output

@router.post("/{correction_id}/resolve", response_model=CorrectionRequestResponse)
def resolve_correction(
    correction_id: str,
    resolve_in: CorrectionRequestResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN", "INSTITUTION_ADMIN"]))
):
    corr = db.query(CorrectionRequest).filter(CorrectionRequest.id == correction_id).first()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction request not found")

    verify_institution_access(corr.institution_id, current_user, db)

    corr.status = resolve_in.status
    corr.review_notes = resolve_in.review_notes
    corr.reviewer_id = current_user.id
    corr.resolved_at = datetime.now(timezone.utc)

    # If APPROVED, apply the adjustment to the student record
    student = db.query(Student).filter(Student.id == corr.student_id).first()
    if resolve_in.status == "APPROVED" and student and hasattr(student, corr.field_name):
        setattr(student, corr.field_name, corr.requested_value)
        student.updated_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=corr.institution_id,
        action=f"CORRECTION_{resolve_in.status}",
        resource_type="CORRECTION",
        resource_id=corr.id,
        details={"status": resolve_in.status, "notes": resolve_in.review_notes}
    ))
    db.commit()
    db.refresh(corr)

    return CorrectionRequestResponse(
        id=corr.id,
        institution_id=corr.institution_id,
        student_id=corr.student_id,
        student_name=student.student_name if student else None,
        institution_reg_num=student.institution_reg_num if student else None,
        field_name=corr.field_name,
        current_value=corr.current_value,
        requested_value=corr.requested_value,
        justification=corr.justification,
        supporting_doc_ref=corr.supporting_doc_ref,
        status=corr.status,
        reviewer_name=current_user.full_name,
        review_notes=corr.review_notes,
        created_at=corr.created_at,
        resolved_at=corr.resolved_at
    )
