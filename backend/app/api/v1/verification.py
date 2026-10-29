import io
import uuid
import base64
import qrcode
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, get_user_roles, verify_institution_access
from app.models.models import VerificationRequest, Student, Institution, Course, User, AuditLog
from app.schemas.schemas import VerificationGenerateRequest, VerificationPublicResponse
from app.services.validation_service import mask_apaar_id

router = APIRouter(prefix="/verification", tags=["Academic Verification"])

def generate_qr_base64(verification_url: str) -> str:
    """
    Generates QR code image as base64 string.
    Only contains verification URL / token reference; NEVER contains raw sensitive IDs.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#14213D", back_color="#FFFFFF")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

@router.post("/request", response_model=VerificationPublicResponse)
def create_verification_request(
    req_in: VerificationGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == req_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    verify_institution_access(student.institution_id, current_user, db)

    # Generate secure verification reference token
    code_token = f"APAAR-VRF-{datetime.now().year}-{uuid.uuid4().hex[:10].upper()}"

    ver_req = VerificationRequest(
        verification_code=code_token,
        student_id=student.id,
        verifier_name=req_in.verifier_name,
        verifier_organization=req_in.verifier_organization,
        purpose=req_in.purpose,
        status="VERIFIED" if student.data_validation_status == "VALID" else "REVIEW_REQUIRED",
        expires_at=datetime.now(timezone.utc) + timedelta(days=90)
    )
    db.add(ver_req)

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=student.institution_id,
        action="VERIFICATION_TOKEN_ISSUED",
        resource_type="VERIFICATION",
        resource_id=code_token,
        details={"student_id": student.id, "purpose": req_in.purpose}
    ))
    db.commit()

    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()
    course = db.query(Course).filter(Course.id == student.course_id).first()

    verify_url = f"{settings.FRONTEND_URL}/verify/{code_token}"
    qr_b64 = generate_qr_base64(verify_url)

    now = datetime.now(timezone.utc)
    # Check expiry
    effective_status = ver_req.status
    if ver_req.revoked_at:
        effective_status = "REVOKED"
    elif ver_req.expires_at and ver_req.expires_at.replace(tzinfo=timezone.utc) < now:
        effective_status = "EXPIRED"

    return VerificationPublicResponse(
        verification_code=code_token,
        status=effective_status,
        student_name=student.student_name,
        institution_name=inst.name if inst else "Unknown",
        course_name=course.course_name if course else "Unknown",
        institution_reg_num=student.institution_reg_num,
        masked_apaar_id=mask_apaar_id(student.apaar_id),
        academic_year=student.academic_year,
        admission_year=student.admission_year,
        admission_status=student.admission_status,
        is_supernumerary=student.is_supernumerary,
        verification_date=ver_req.created_at,
        expires_at=ver_req.expires_at,
        revoked_at=ver_req.revoked_at,
        revocation_reason=ver_req.revocation_reason,
        demo_mode=True,
        qr_code_base64=qr_b64,
        claim_details={
            "token_validity": "CRYPTOGRAPHICALLY_ACTIVE" if effective_status not in ["EXPIRED", "REVOKED"] else effective_status,
            "academic_claim": "VERIFIED_INSTITUTIONAL_RECORD" if student.data_validation_status == "VALID" else "REVIEW_REQUIRED_DISCREPANCIES",
            "apaar_verification_status": "Demonstration Mode — Official APAAR Verification Not Connected"
        }
    )

@router.get("/verify/{verification_code}", response_model=VerificationPublicResponse)
def verify_academic_record(
    verification_code: str,
    db: Session = Depends(get_db)
):
    """
    Public academic credential verification endpoint.
    Used by employers, background verifiers, or credential scanners.
    Strictly distinguishes:
    1. Valid verification reference token
    2. Verified academic claim (matches college registry)
    3. Official APAAR verification (clearly labelled simulation)
    """
    ver_req = db.query(VerificationRequest).filter(
        VerificationRequest.verification_code == verification_code
    ).first()

    if not ver_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification token not found or invalid."
        )

    student = db.query(Student).filter(Student.id == ver_req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Associated student record not found.")

    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()
    course = db.query(Course).filter(Course.id == student.course_id).first()

    verify_url = f"{settings.FRONTEND_URL}/verify/{verification_code}"
    qr_b64 = generate_qr_base64(verify_url)

    # Determine live status including expiration & revocation
    now = datetime.now(timezone.utc)
    effective_status = ver_req.status
    if ver_req.revoked_at:
        effective_status = "REVOKED"
    elif ver_req.expires_at and ver_req.expires_at.replace(tzinfo=timezone.utc) < now:
        effective_status = "EXPIRED"

    # Log public verification query
    db.add(AuditLog(
        user_id=None,
        institution_id=student.institution_id,
        action="PUBLIC_CREDENTIAL_VERIFIED",
        resource_type="VERIFICATION",
        resource_id=verification_code,
        details={"student_reg": student.institution_reg_num, "status": effective_status}
    ))
    db.commit()

    return VerificationPublicResponse(
        verification_code=verification_code,
        status=effective_status,
        student_name=student.student_name,
        institution_name=inst.name if inst else "Unknown",
        course_name=course.course_name if course else "Unknown",
        institution_reg_num=student.institution_reg_num,
        masked_apaar_id=mask_apaar_id(student.apaar_id),
        academic_year=student.academic_year,
        admission_year=student.admission_year,
        admission_status=student.admission_status,
        is_supernumerary=student.is_supernumerary,
        verification_date=ver_req.created_at,
        expires_at=ver_req.expires_at,
        revoked_at=ver_req.revoked_at,
        revocation_reason=ver_req.revocation_reason,
        demo_mode=True,
        qr_code_base64=qr_b64,
        claim_details={
            "token_validity": "CRYPTOGRAPHICALLY_ACTIVE" if effective_status not in ["EXPIRED", "REVOKED"] else effective_status,
            "academic_claim": "VERIFIED_INSTITUTIONAL_RECORD" if student.data_validation_status == "VALID" else "REVIEW_REQUIRED_DISCREPANCIES",
            "apaar_verification_status": "Demonstration Mode — Official APAAR Verification Not Connected"
        }
    )

@router.post("/{verification_code}/revoke")
def revoke_verification_token(
    verification_code: str,
    revoke_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revokes an active academic verification token (e.g., in case of data adjustment, transfer, or withdrawal).
    """
    ver_req = db.query(VerificationRequest).filter(
        VerificationRequest.verification_code == verification_code
    ).first()
    if not ver_req:
        raise HTTPException(status_code=404, detail="Verification token not found")

    student = db.query(Student).filter(Student.id == ver_req.student_id).first()
    if student:
        verify_institution_access(student.institution_id, current_user, db)

    reason = revoke_data.get("reason", "Revoked by authorized institution officer")
    ver_req.status = "REVOKED"
    ver_req.revoked_at = datetime.now(timezone.utc)
    ver_req.revocation_reason = reason
    ver_req.revoked_by_user_id = current_user.id

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=student.institution_id if student else None,
        action="VERIFICATION_TOKEN_REVOKED",
        resource_type="VERIFICATION",
        resource_id=verification_code,
        details={"reason": reason}
    ))
    db.commit()

    return {"status": "SUCCESS", "message": f"Verification token {verification_code} has been successfully revoked."}

