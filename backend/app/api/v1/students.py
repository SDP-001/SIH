from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, verify_institution_access, get_user_roles
from app.models.models import Student, Institution, Course, ApprovedIntake, DuplicateAlert, AuditLog, User
from app.schemas.schemas import StudentCreate, StudentUpdate, StudentResponse
from app.services.validation_service import mask_apaar_id, validate_apaar_format, check_duplicate_enrolment, simulate_apaar_verification

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse], include_in_schema=False)
@router.get("/", response_model=List[StudentResponse])
def list_students(
    institution_id: Optional[str] = None,
    course_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    apaar_status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    query = db.query(Student, Institution.name.label("institution_name"), Course.course_name).join(
        Institution, Student.institution_id == Institution.id
    ).join(
        Course, Student.course_id == Course.id
    )

    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(Student.institution_id == current_user.institution_id)
        else:
            return []
    elif institution_id:
        query = query.filter(Student.institution_id == institution_id)

    if course_id:
        query = query.filter(Student.course_id == course_id)
    if academic_year:
        query = query.filter(Student.academic_year == academic_year)
    if apaar_status:
        query = query.filter(Student.apaar_status == apaar_status)
    if search:
        query = query.filter(
            (Student.student_name.ilike(f"%{search}%")) |
            (Student.institution_reg_num.ilike(f"%{search}%")) |
            (Student.email.ilike(f"%{search}%"))
        )

    results = query.order_by(Student.created_at.desc()).offset(skip).limit(limit).all()

    output = []
    for s, inst_name, c_name in results:
        output.append(StudentResponse(
            id=s.id,
            institution_id=s.institution_id,
            institution_name=inst_name,
            course_id=s.course_id,
            course_name=c_name,
            student_name=s.student_name,
            institution_reg_num=s.institution_reg_num,
            masked_apaar_id=mask_apaar_id(s.apaar_id),
            email=s.email,
            phone=s.phone,
            academic_year=s.academic_year,
            admission_year=s.admission_year,
            admission_status=s.admission_status,
            admission_category=s.admission_category,
            is_supernumerary=s.is_supernumerary,
            supernumerary_category=s.supernumerary_category,
            apaar_status=s.apaar_status,
            data_validation_status=s.data_validation_status,
            created_at=s.created_at
        ))
    return output

@router.post("", response_model=StudentResponse, include_in_schema=False)
@router.post("/", response_model=StudentResponse)
def create_student(
    student_in: StudentCreate,
    institution_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)

    # 1. Verify Course belongs to institution
    course = db.query(Course).filter(
        Course.id == student_in.course_id,
        Course.institution_id == institution_id
    ).first()
    if not course:
        raise HTTPException(status_code=400, detail="Invalid course specified for this institution")

    # 2. Check duplicate enrolment
    dup_checks = check_duplicate_enrolment(
        db=db,
        student_name=student_in.student_name,
        institution_id=institution_id,
        institution_reg_num=student_in.institution_reg_num,
        apaar_id=student_in.apaar_id,
        academic_year=student_in.academic_year
    )

    validation_status = "VALID"
    apaar_status = "NOT_CHECKED"

    # 3. Validate APAAR format if provided
    if student_in.apaar_id:
        is_valid_format, reason = validate_apaar_format(student_in.apaar_id)
        if not is_valid_format:
            validation_status = "WARNING"
            apaar_status = "INVALID"
        else:
            apaar_status = "FORMAT_VALID"

    new_student = Student(
        institution_id=institution_id,
        course_id=student_in.course_id,
        student_name=student_in.student_name,
        institution_reg_num=student_in.institution_reg_num,
        apaar_id=student_in.apaar_id,
        email=student_in.email,
        phone=student_in.phone,
        date_of_birth=student_in.date_of_birth,
        gender=student_in.gender,
        academic_year=student_in.academic_year,
        admission_year=student_in.admission_year,
        admission_status="ACTIVE",
        admission_category=student_in.admission_category,
        is_supernumerary=student_in.is_supernumerary,
        supernumerary_category=student_in.supernumerary_category,
        is_nri=student_in.is_nri,
        is_foreign_national=student_in.is_foreign_national,
        apaar_status=apaar_status,
        data_validation_status=validation_status
    )
    db.add(new_student)
    db.flush()

    # Create duplicate alerts if found
    for alert_info in dup_checks:
        alert = DuplicateAlert(
            student_id=new_student.id,
            matched_student_id=alert_info.get("matched_student_id"),
            institution_a_id=alert_info.get("institution_a_id"),
            institution_b_id=alert_info.get("institution_b_id"),
            match_category=alert_info["match_category"],
            severity=alert_info["severity"],
            reason=alert_info["reason"],
            apaar_masked=mask_apaar_id(student_in.apaar_id),
            status="NEW"
        )
        db.add(alert)
        new_student.data_validation_status = "WARNING"

    # Update actual enrolment count for the approved intake record
    intake = db.query(ApprovedIntake).filter(
        ApprovedIntake.institution_id == institution_id,
        ApprovedIntake.course_id == student_in.course_id,
        ApprovedIntake.academic_year == student_in.academic_year
    ).first()
    if intake:
        intake.actual_enrolment += 1
        if student_in.is_supernumerary:
            intake.supernumerary_enrolled += 1

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=institution_id,
        action="STUDENT_CREATED",
        resource_type="STUDENT",
        resource_id=new_student.id,
        details={"reg_num": student_in.institution_reg_num, "course_id": student_in.course_id}
    ))

    db.commit()
    db.refresh(new_student)

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    return StudentResponse(
        id=new_student.id,
        institution_id=new_student.institution_id,
        institution_name=inst.name if inst else None,
        course_id=new_student.course_id,
        course_name=course.course_name,
        student_name=new_student.student_name,
        institution_reg_num=new_student.institution_reg_num,
        masked_apaar_id=mask_apaar_id(new_student.apaar_id),
        email=new_student.email,
        phone=new_student.phone,
        academic_year=new_student.academic_year,
        admission_year=new_student.admission_year,
        admission_status=new_student.admission_status,
        admission_category=new_student.admission_category,
        is_supernumerary=new_student.is_supernumerary,
        supernumerary_category=new_student.supernumerary_category,
        apaar_status=new_student.apaar_status,
        data_validation_status=new_student.data_validation_status,
        created_at=new_student.created_at
    )

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    verify_institution_access(student.institution_id, current_user, db)

    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()
    course = db.query(Course).filter(Course.id == student.course_id).first()

    return StudentResponse(
        id=student.id,
        institution_id=student.institution_id,
        institution_name=inst.name if inst else None,
        course_id=student.course_id,
        course_name=course.course_name if course else None,
        student_name=student.student_name,
        institution_reg_num=student.institution_reg_num,
        masked_apaar_id=mask_apaar_id(student.apaar_id),
        email=student.email,
        phone=student.phone,
        academic_year=student.academic_year,
        admission_year=student.admission_year,
        admission_status=student.admission_status,
        admission_category=student.admission_category,
        is_supernumerary=student.is_supernumerary,
        supernumerary_category=student.supernumerary_category,
        apaar_status=student.apaar_status,
        data_validation_status=student.data_validation_status,
        created_at=student.created_at
    )

@router.post("/{student_id}/verify-apaar")
def verify_student_apaar(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    verify_institution_access(student.institution_id, current_user, db)

    if not student.apaar_id:
        raise HTTPException(status_code=400, detail="Cannot verify: No APAAR ID recorded for this student")

    verification_result = simulate_apaar_verification(student.apaar_id)
    student.apaar_status = verification_result["status"]
    if verification_result["status"] == "VERIFIED":
        student.apaar_verified_at = datetime.now(timezone.utc)
        student.apaar_verification_ref = verification_result["verification_ref"]
        student.data_validation_status = "VALID"
    elif verification_result["status"] == "INVALID":
        student.data_validation_status = "ERROR"

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=student.institution_id,
        action="APAAR_VERIFIED",
        resource_type="STUDENT",
        resource_id=student.id,
        details=verification_result
    ))
    db.commit()

    return {
        "student_id": student.id,
        "masked_apaar_id": mask_apaar_id(student.apaar_id),
        "status": student.apaar_status,
        "verification_ref": student.apaar_verification_ref,
        "verified_at": student.apaar_verified_at,
        "message": verification_result["message"],
        "demonstration_mode": True
    }
