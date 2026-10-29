from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, verify_institution_access, get_user_roles
from app.models.models import (
    Institution, Student, ApprovedIntake, DuplicateAlert,
    ImportBatch, Course, User
)
from app.schemas.schemas import AICTEDashboardMetrics, InstitutionDashboardMetrics, DuplicateAlertResponse
from app.services.validation_service import mask_apaar_id

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])

@router.get("/aicte", response_model=AICTEDashboardMetrics)
def get_aicte_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN"]))
):
    total_institutions = db.query(func.count(Institution.id)).scalar() or 0
    total_students = db.query(func.count(Student.id)).scalar() or 0
    total_intake = db.query(func.sum(ApprovedIntake.approved_intake)).scalar() or 0

    # Institutions with excess intake
    excess_intake_inst_count = db.query(
        func.count(func.distinct(ApprovedIntake.institution_id))
    ).filter(
        ApprovedIntake.actual_enrolment > ApprovedIntake.approved_intake
    ).scalar() or 0

    open_duplicates = db.query(func.count(DuplicateAlert.id)).filter(
        DuplicateAlert.status.in_(["NEW", "UNDER_REVIEW"])
    ).scalar() or 0

    pending_apaar = db.query(func.count(Student.id)).filter(
        Student.apaar_status.in_(["NOT_CHECKED", "PENDING", "FORMAT_VALID"])
    ).scalar() or 0

    verified_apaar = db.query(func.count(Student.id)).filter(
        Student.apaar_status == "VERIFIED"
    ).scalar() or 0

    data_quality_issues = db.query(func.count(Student.id)).filter(
        Student.data_validation_status.in_(["WARNING", "ERROR"])
    ).scalar() or 0

    # State-wise distribution
    state_results = db.query(
        Institution.state,
        func.count(Student.id).label("student_count"),
        func.count(func.distinct(Institution.id)).label("institution_count")
    ).outerjoin(
        Student, Institution.id == Student.institution_id
    ).group_by(Institution.state).all()

    enrolment_by_state = [
        {"state": s[0], "students": s[1], "institutions": s[2]}
        for s in state_results
    ]

    # Course / Stream Intake vs Enrolment
    intake_results = db.query(
        Course.course_name,
        func.sum(ApprovedIntake.approved_intake).label("approved"),
        func.sum(ApprovedIntake.actual_enrolment).label("enrolled")
    ).join(
        ApprovedIntake, Course.id == ApprovedIntake.course_id
    ).group_by(Course.course_name).limit(6).all()

    intake_vs_enrolment = [
        {"course": r[0], "approved": int(r[1] or 0), "enrolled": int(r[2] or 0)}
        for r in intake_results
    ]

    # Top courses enrolment
    top_courses = db.query(
        Course.course_name,
        func.count(Student.id).label("total")
    ).join(
        Student, Course.id == Student.course_id
    ).group_by(Course.course_name).order_by(func.count(Student.id).desc()).limit(5).all()

    top_courses_enrolment = [
        {"name": tc[0], "count": tc[1]}
        for tc in top_courses
    ]

    # Recent duplicate alerts
    recent_dups = db.query(DuplicateAlert).order_by(DuplicateAlert.created_at.desc()).limit(5).all()
    dup_responses = []
    for d in recent_dups:
        inst_a = db.query(Institution).filter(Institution.id == d.institution_a_id).first() if d.institution_a_id else None
        inst_b = db.query(Institution).filter(Institution.id == d.institution_b_id).first() if d.institution_b_id else None
        s = db.query(Student).filter(Student.id == d.student_id).first() if d.student_id else None
        dup_responses.append(DuplicateAlertResponse(
            id=d.id,
            student_id=d.student_id,
            matched_student_id=d.matched_student_id,
            student_name=s.student_name if s else None,
            institution_a_name=inst_a.name if inst_a else None,
            institution_b_name=inst_b.name if inst_b else None,
            match_category=d.match_category,
            severity=d.severity,
            reason=d.reason,
            apaar_masked=d.apaar_masked,
            status=d.status,
            resolution_notes=d.resolution_notes,
            created_at=d.created_at
        ))

    return AICTEDashboardMetrics(
        total_institutions=total_institutions,
        total_reported_students=total_students,
        total_approved_intake=int(total_intake),
        institutions_with_excess_intake=excess_intake_inst_count,
        open_duplicate_alerts=open_duplicates,
        pending_apaar_verifications=pending_apaar,
        verified_apaar_count=verified_apaar,
        data_quality_issues=data_quality_issues,
        enrolment_by_state=enrolment_by_state,
        intake_vs_enrolment=intake_vs_enrolment,
        top_courses_enrolment=top_courses_enrolment,
        recent_duplicate_alerts=dup_responses,
        demo_mode=True
    )

@router.get("/institution/{institution_id}", response_model=InstitutionDashboardMetrics)
def get_institution_dashboard(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    total_students = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id
    ).scalar() or 0

    approved_intake_sum = db.query(func.sum(ApprovedIntake.approved_intake)).filter(
        ApprovedIntake.institution_id == institution_id
    ).scalar() or 0

    actual_enrolment_sum = db.query(func.sum(ApprovedIntake.actual_enrolment)).filter(
        ApprovedIntake.institution_id == institution_id
    ).scalar() or 0

    supernumerary_sum = db.query(func.sum(ApprovedIntake.supernumerary_enrolled)).filter(
        ApprovedIntake.institution_id == institution_id
    ).scalar() or 0

    validated_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.data_validation_status == "VALID"
    ).scalar() or 0

    warnings_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.data_validation_status == "WARNING"
    ).scalar() or 0

    errors_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.data_validation_status == "ERROR"
    ).scalar() or 0

    pending_apaar = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.apaar_status.in_(["NOT_CHECKED", "PENDING", "FORMAT_VALID"])
    ).scalar() or 0

    verified_apaar = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.apaar_status == "VERIFIED"
    ).scalar() or 0

    open_duplicates = db.query(func.count(DuplicateAlert.id)).filter(
        (DuplicateAlert.institution_a_id == institution_id) |
        (DuplicateAlert.institution_b_id == institution_id),
        DuplicateAlert.status.in_(["NEW", "UNDER_REVIEW"])
    ).scalar() or 0

    # Course breakdown
    course_intakes = db.query(
        Course.course_name,
        ApprovedIntake.approved_intake,
        ApprovedIntake.actual_enrolment,
        ApprovedIntake.supernumerary_quota,
        ApprovedIntake.supernumerary_enrolled
    ).join(
        ApprovedIntake, Course.id == ApprovedIntake.course_id
    ).filter(
        Course.institution_id == institution_id
    ).all()

    breakdown = [
        {
            "course": ci[0],
            "approved": ci[1],
            "actual": ci[2],
            "supernumerary_quota": ci[3],
            "supernumerary_enrolled": ci[4],
            "is_excess": ci[2] > ci[1]
        }
        for ci in course_intakes
    ]

    recent_batches = db.query(ImportBatch).filter(
        ImportBatch.institution_id == institution_id
    ).order_by(ImportBatch.created_at.desc()).limit(5).all()

    return InstitutionDashboardMetrics(
        institution_id=inst.id,
        institution_name=inst.name,
        total_students=total_students,
        approved_intake=int(approved_intake_sum),
        actual_enrolment=int(actual_enrolment_sum),
        supernumerary_enrolled=int(supernumerary_sum),
        validated_records=validated_count,
        records_with_warnings=warnings_count,
        records_with_errors=errors_count,
        pending_apaar_verification=pending_apaar,
        verified_apaar_count=verified_apaar,
        open_duplicate_alerts=open_duplicates,
        course_intake_breakdown=breakdown,
        recent_batches=recent_batches,
        demo_mode=True
    )
