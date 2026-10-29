from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, verify_institution_access, get_user_roles
from app.models.models import Institution, Department, Course, User, AuditLog
from app.schemas.schemas import (
    InstitutionCreate, InstitutionUpdate, InstitutionResponse,
    DepartmentCreate, DepartmentResponse, CourseCreate, CourseResponse
)

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("", response_model=List[InstitutionResponse], include_in_schema=False)
@router.get("/", response_model=List[InstitutionResponse])
def list_institutions(
    state: Optional[str] = None,
    institution_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    query = db.query(Institution)

    # Institution users only see their own institution
    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(Institution.id == current_user.institution_id)
        else:
            return []

    if state:
        query = query.filter(Institution.state.ilike(f"%{state}%"))
    if institution_type:
        query = query.filter(Institution.institution_type == institution_type)
    if search:
        query = query.filter(
            (Institution.name.ilike(f"%{search}%")) |
            (Institution.institution_code.ilike(f"%{search}%")) |
            (Institution.aicte_approval_ref.ilike(f"%{search}%"))
        )

    return query.order_by(Institution.name.asc()).all()

@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst

@router.post("", response_model=InstitutionResponse, include_in_schema=False)
@router.post("/", response_model=InstitutionResponse)
def create_institution(
    inst_in: InstitutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN"]))
):
    existing = db.query(Institution).filter(Institution.institution_code == inst_in.institution_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Institution code already registered")

    new_inst = Institution(
        institution_code=inst_in.institution_code,
        name=inst_in.name,
        aicte_approval_ref=inst_in.aicte_approval_ref,
        institution_type=inst_in.institution_type,
        state=inst_in.state,
        district=inst_in.district,
        address=inst_in.address,
        contact_email=inst_in.contact_email,
        contact_phone=inst_in.contact_phone,
        status="APPROVED",
        is_simulated=True
    )
    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)
    return new_inst

@router.patch("/{institution_id}", response_model=InstitutionResponse)
def update_institution(
    institution_id: str,
    inst_update: InstitutionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    update_data = inst_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inst, field, value)

    db.commit()
    db.refresh(inst)
    return inst

# --- Departments ---
@router.get("/{institution_id}/departments", response_model=List[DepartmentResponse])
def get_departments(
    institution_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)
    return db.query(Department).filter(Department.institution_id == institution_id).all()

@router.post("/{institution_id}/departments", response_model=DepartmentResponse)
def create_department(
    institution_id: str,
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)
    existing = db.query(Department).filter(
        Department.institution_id == institution_id,
        Department.code == dept_in.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department code already exists in this institution")

    dept = Department(
        institution_id=institution_id,
        name=dept_in.name,
        code=dept_in.code
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

# --- Courses ---
@router.get("/{institution_id}/courses", response_model=List[CourseResponse])
def get_courses(
    institution_id: str,
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)
    query = db.query(Course).filter(Course.institution_id == institution_id)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    return query.all()

@router.post("/{institution_id}/courses", response_model=CourseResponse)
def create_course(
    institution_id: str,
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)
    course = Course(
        institution_id=institution_id,
        department_id=course_in.department_id,
        course_name=course_in.course_name,
        course_code=course_in.course_code,
        degree_level=course_in.degree_level,
        duration_years=course_in.duration_years
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course
