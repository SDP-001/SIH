import io
import pandas as pd
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, verify_institution_access, get_user_roles
from app.models.models import (
    ImportBatch, ImportBatchError, Student, Course, ApprovedIntake,
    DuplicateAlert, Institution, User, AuditLog
)
from app.schemas.schemas import ImportBatchResponse, ImportBatchErrorResponse
from app.services.validation_service import (
    mask_apaar_id, validate_apaar_format, check_duplicate_enrolment
)

router = APIRouter(prefix="/imports", tags=["Bulk Data Import"])

TEMPLATE_COLUMNS = [
    "student_name", "institution_reg_num", "course_code", "academic_year",
    "admission_year", "apaar_id", "email", "phone", "date_of_birth",
    "gender", "admission_category", "is_supernumerary", "supernumerary_category"
]

@router.get("/template")
def download_template(file_format: str = Query("csv", pattern="^(csv|xlsx)$")):
    """
    Downloads standard student data onboarding template in CSV or Excel format.
    """
    sample_rows = [
        {
            "student_name": "Aarav Sharma",
            "institution_reg_num": "BT-2024-001",
            "course_code": "BT-CSE",
            "academic_year": "2024-2025",
            "admission_year": 2024,
            "apaar_id": "SIM-APAAR-2024-110294",
            "email": "aarav.sharma@example.edu.in",
            "phone": "+91-9876500001",
            "date_of_birth": "2006-02-15",
            "gender": "Male",
            "admission_category": "GENERAL",
            "is_supernumerary": "False",
            "supernumerary_category": ""
        },
        {
            "student_name": "Sneha Kulkarni",
            "institution_reg_num": "BT-2024-002",
            "course_code": "BT-CSE",
            "academic_year": "2024-2025",
            "admission_year": 2024,
            "apaar_id": "SIM-APAAR-2024-220914",
            "email": "sneha.k@example.edu.in",
            "phone": "+91-9876500002",
            "date_of_birth": "2005-10-20",
            "gender": "Female",
            "admission_category": "OBC",
            "is_supernumerary": "True",
            "supernumerary_category": "TFW"
        }
    ]

    df = pd.DataFrame(sample_rows, columns=TEMPLATE_COLUMNS)

    if file_format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = Response(content=stream.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=apaar_student_import_template.csv"
        return response
    else:
        stream = io.BytesIO()
        with pd.ExcelWriter(stream, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Students")
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=apaar_student_import_template.xlsx"}
        )

@router.post("/upload", response_model=ImportBatchResponse)
async def upload_student_batch(
    file: UploadFile = File(...),
    institution_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(institution_id, current_user, db)

    # 1. Validate file extension
    filename = file.filename or "upload"
    file_ext = filename.split(".")[-1].lower()
    if file_ext not in ["csv", "xlsx"]:
        raise HTTPException(status_code=400, detail="Invalid file format. Only CSV and XLSX are supported.")

    contents = await file.read()
    file_size = len(contents)
    if file_size > 15 * 1024 * 1024: # 15MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit (15MB).")

    # 2. Parse file
    try:
        if file_ext == "csv":
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse spreadsheet: {str(e)}")

    # Clean headers
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Validate required columns
    required_cols = ["student_name", "institution_reg_num", "course_code", "academic_year", "admission_year"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file is missing mandatory columns: {', '.join(missing_cols)}"
        )

    # Create Batch Record
    batch = ImportBatch(
        institution_id=institution_id,
        uploaded_by_user_id=current_user.id,
        file_name=filename,
        file_type=file_ext.upper(),
        file_size_bytes=file_size,
        total_rows=len(df),
        status="VALIDATING"
    )
    db.add(batch)
    db.flush()

    # Pre-fetch institution courses for fast matching
    courses = db.query(Course).filter(Course.institution_id == institution_id).all()
    course_code_map = {c.course_code.upper(): c for c in courses}

    valid_rows = 0
    warning_rows = 0
    error_rows = 0
    imported_rows = 0
    skipped_rows = 0

    seen_in_batch_regs = set()
    seen_in_batch_apaar = set()

    for idx, row in df.iterrows():
        row_num = idx + 2 # Excel row number (1-indexed + header)
        row_errors = []
        row_warnings = []

        # Extract values
        s_name = str(row.get("student_name", "")).strip() if pd.notna(row.get("student_name")) else ""
        s_reg = str(row.get("institution_reg_num", "")).strip() if pd.notna(row.get("institution_reg_num")) else ""
        c_code = str(row.get("course_code", "")).strip().upper() if pd.notna(row.get("course_code")) else ""
        acad_year = str(row.get("academic_year", "")).strip() if pd.notna(row.get("academic_year")) else ""
        adm_year_val = row.get("admission_year")
        apaar = str(row.get("apaar_id", "")).strip() if pd.notna(row.get("apaar_id")) else None

        # Check required fields
        if not s_name:
            row_errors.append("Student Name is required.")
        if not s_reg:
            row_errors.append("Institution Registration Number is required.")
        if not c_code:
            row_errors.append("Course Code is required.")
        if not acad_year:
            row_errors.append("Academic Year is required.")

        try:
            adm_year = int(adm_year_val) if pd.notna(adm_year_val) else 2024
        except Exception:
            row_errors.append("Admission Year must be a valid integer year.")
            adm_year = 2024

        # Validate course exists in institution
        matched_course = course_code_map.get(c_code)
        if not matched_course:
            row_errors.append(f"Course code '{c_code}' does not exist in institution profile.")

        # Check within-file duplicate registration number
        if s_reg:
            if s_reg in seen_in_batch_regs:
                row_errors.append(f"Duplicate registration number '{s_reg}' found within this upload batch.")
            else:
                seen_in_batch_regs.add(s_reg)

        # Check within-file duplicate APAAR
        if apaar and apaar != "":
            if apaar in seen_in_batch_apaar:
                row_warnings.append(f"Duplicate APAAR ID '{mask_apaar_id(apaar)}' detected multiple times in this batch.")
            else:
                seen_in_batch_apaar.add(apaar)

        # Check APAAR format
        apaar_status = "NOT_CHECKED"
        if apaar and apaar != "":
            is_valid_format, reason = validate_apaar_format(apaar)
            if not is_valid_format:
                row_warnings.append(f"APAAR format warning: {reason}")
                apaar_status = "INVALID"
            else:
                apaar_status = "FORMAT_VALID"

        # Check DB duplicates if no blocking errors yet
        if not row_errors and matched_course:
            dup_matches = check_duplicate_enrolment(
                db=db,
                student_name=s_name,
                institution_id=institution_id,
                institution_reg_num=s_reg,
                apaar_id=apaar,
                academic_year=acad_year
            )
            for dup in dup_matches:
                if dup["match_category"] == "SAME_INSTITUTION_REG_DUPLICATE":
                    row_errors.append(dup["reason"])
                else:
                    row_warnings.append(dup["reason"])

        # Decide row outcome
        if row_errors:
            error_rows += 1
            skipped_rows += 1
            for err in row_errors:
                db.add(ImportBatchError(
                    batch_id=batch.id,
                    row_number=row_num,
                    error_level="ERROR",
                    error_category="DATA_VALIDATION_ERROR",
                    error_message=err,
                    raw_data=dict(row)
                ))
        else:
            # Valid or warning row -> Save student
            if row_warnings:
                warning_rows += 1
                row_val_status = "WARNING"
                for warn in row_warnings:
                    db.add(ImportBatchError(
                        batch_id=batch.id,
                        row_number=row_num,
                        error_level="WARNING",
                        error_category="DUPLICATE_OR_FORMAT_WARNING",
                        error_message=warn,
                        raw_data=dict(row)
                    ))
            else:
                valid_rows += 1
                row_val_status = "VALID"

            # Parse supernumerary
            is_sup = False
            raw_sup = str(row.get("is_supernumerary", "")).lower()
            if raw_sup in ["true", "1", "yes"]:
                is_sup = True
            sup_cat = str(row.get("supernumerary_category", "")).strip() if pd.notna(row.get("supernumerary_category")) else None

            new_student = Student(
                institution_id=institution_id,
                course_id=matched_course.id,
                import_batch_id=batch.id,
                student_name=s_name,
                institution_reg_num=s_reg,
                apaar_id=apaar if apaar else None,
                email=str(row.get("email", "")).strip() if pd.notna(row.get("email")) else None,
                phone=str(row.get("phone", "")).strip() if pd.notna(row.get("phone")) else None,
                date_of_birth=str(row.get("date_of_birth", "")).strip() if pd.notna(row.get("date_of_birth")) else None,
                gender=str(row.get("gender", "")).strip() if pd.notna(row.get("gender")) else None,
                academic_year=acad_year,
                admission_year=adm_year,
                admission_status="ACTIVE",
                admission_category=str(row.get("admission_category", "GENERAL")).strip() if pd.notna(row.get("admission_category")) else "GENERAL",
                is_supernumerary=is_sup,
                supernumerary_category=sup_cat,
                apaar_status=apaar_status,
                data_validation_status=row_val_status
            )
            db.add(new_student)
            db.flush()
            imported_rows += 1

            # Update actual intake count
            intake = db.query(ApprovedIntake).filter(
                ApprovedIntake.institution_id == institution_id,
                ApprovedIntake.course_id == matched_course.id,
                ApprovedIntake.academic_year == acad_year
            ).first()
            if intake:
                intake.actual_enrolment += 1
                if is_sup:
                    intake.supernumerary_enrolled += 1

    # Finalize batch status
    batch.valid_rows = valid_rows
    batch.warning_rows = warning_rows
    batch.error_rows = error_rows
    batch.imported_rows = imported_rows
    batch.skipped_rows = skipped_rows
    batch.status = "COMPLETED" if error_rows == 0 else ("PARTIALLY_IMPORTED" if imported_rows > 0 else "FAILED")
    batch.summary_notes = f"Batch import finished: {imported_rows} students saved ({warning_rows} with warnings), {skipped_rows} skipped due to errors."

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=institution_id,
        action="BATCH_IMPORTED",
        resource_type="BATCH",
        resource_id=batch.id,
        details={
            "file": filename,
            "total": batch.total_rows,
            "imported": imported_rows,
            "errors": error_rows,
            "warnings": warning_rows
        }
    ))

    db.commit()
    db.refresh(batch)
    return batch

@router.get("/batches", response_model=List[ImportBatchResponse])
def list_batches(
    institution_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    query = db.query(ImportBatch)

    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(ImportBatch.institution_id == current_user.institution_id)
        else:
            return []
    elif institution_id:
        query = query.filter(ImportBatch.institution_id == institution_id)

    return query.order_by(ImportBatch.created_at.desc()).all()

@router.get("/{batch_id}/errors", response_model=List[ImportBatchErrorResponse])
def get_batch_errors(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    verify_institution_access(batch.institution_id, current_user, db)
    return db.query(ImportBatchError).filter(ImportBatchError.batch_id == batch_id).order_by(ImportBatchError.row_number.asc()).all()
