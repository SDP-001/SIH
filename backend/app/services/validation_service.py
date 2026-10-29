import re
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Student, DuplicateAlert, Institution, Course, ApprovedIntake

def mask_apaar_id(apaar: Optional[str]) -> Optional[str]:
    """
    Masks sensitive APAAR identifier to preserve privacy in UI/logs.
    Example: '420192831234' -> '42XXXX1234' (matching reference design)
             'SIM-APAAR-2024-984210' -> 'SIM-APAAR-****-984210'
    """
    if not apaar:
        return None
    val = str(apaar).strip()
    if len(val) == 12 and val.isdigit():
        return f"{val[:2]}XXXX{val[-4:]}"
    if val.startswith("42") and len(val) >= 8:
        return f"{val[:2]}XXXX{val[-4:]}"
    if len(val) <= 4:
        return "****"
    if val.startswith("SIM-APAAR-"):
        parts = val.split("-")
        if len(parts) >= 4:
            return f"{parts[0]}-{parts[1]}-****-{parts[3]}"
        return f"SIM-APAAR-****-{val[-4:]}"
    return f"{'*' * (len(val) - 4)}{val[-4:]}"

def validate_apaar_format(apaar: Optional[str]) -> Tuple[bool, str]:
    r"""
    Validates APAAR ID format.
    Accepts:
    1. Official 12-digit numeric APAAR standard: \d{12}
    2. Demo/Simulated APAAR format: SIM-APAAR-\d{4}-\d{6}
    """
    if not apaar:
        return False, "APAAR ID is missing or empty"
    val = str(apaar).strip()
    # Check 12-digit standard
    if re.fullmatch(r"^\d{12}$", val):
        return True, "FORMAT_VALID"
    # Check simulated test standard
    if re.fullmatch(r"^SIM-APAAR-\d{4}-\d{6}$", val):
        return True, "FORMAT_VALID"
    return False, "INVALID_FORMAT: Must be 12-digit numeric or simulated format SIM-APAAR-YYYY-XXXXXX"

def check_duplicate_enrolment(
    db: Session,
    student_name: str,
    institution_id: str,
    institution_reg_num: str,
    apaar_id: Optional[str],
    academic_year: str,
    current_student_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Runs multi-tier duplicate checks:
    1. Internal Institution Registration Number conflict
    2. Exact APAAR match in other institutions (Cross-Institution Duplicate Enrolment)
    """
    alerts = []

    # Check 1: Same institution registration number
    reg_query = db.query(Student).filter(
        Student.institution_id == institution_id,
        Student.institution_reg_num == institution_reg_num
    )
    if current_student_id:
        reg_query = reg_query.filter(Student.id != current_student_id)
    same_reg = reg_query.first()
    if same_reg:
        alerts.append({
            "match_category": "SAME_INSTITUTION_REG_DUPLICATE",
            "severity": "CRITICAL",
            "reason": f"Registration number '{institution_reg_num}' is already assigned to student '{same_reg.student_name}' in this institution.",
            "matched_student_id": same_reg.id,
            "institution_a_id": institution_id,
            "institution_b_id": institution_id
        })

    # Check 2: APAAR duplicate across ANY institution for same academic year
    if apaar_id and apaar_id.strip():
        apaar_val = apaar_id.strip()
        apaar_query = db.query(Student).filter(
            Student.apaar_id == apaar_val,
            Student.academic_year == academic_year
        )
        if current_student_id:
            apaar_query = apaar_query.filter(Student.id != current_student_id)
        existing_matches = apaar_query.all()

        for match in existing_matches:
            if match.institution_id != institution_id:
                inst_b = db.query(Institution).filter(Institution.id == match.institution_id).first()
                b_name = inst_b.name if inst_b else "External Institution"
                alerts.append({
                    "match_category": "CROSS_INSTITUTION_ENROLMENT",
                    "severity": "CRITICAL",
                    "reason": f"Student '{student_name}' with APAAR ID {mask_apaar_id(apaar_val)} is also registered at '{b_name}' for academic year {academic_year}.",
                    "matched_student_id": match.id,
                    "institution_a_id": institution_id,
                    "institution_b_id": match.institution_id
                })
            else:
                alerts.append({
                    "match_category": "EXACT_APAAR_CONFLICT",
                    "severity": "HIGH",
                    "reason": f"APAAR ID {mask_apaar_id(apaar_val)} is already associated with another record ({match.institution_reg_num}) in this institution.",
                    "matched_student_id": match.id,
                    "institution_a_id": institution_id,
                    "institution_b_id": institution_id
                })

    return alerts

def simulate_apaar_verification(apaar_id: str) -> Dict[str, Any]:
    """
    Adapter for APAAR Verification Service.
    In hackathon demo mode, validates format and provides simulated official handshake.
    If official credentials are later provided, this adapter calls the authorized gateway.
    """
    is_valid, reason = validate_apaar_format(apaar_id)
    if not is_valid:
        return {
            "status": "INVALID",
            "message": reason,
            "verification_ref": None,
            "is_simulated": True
        }
    
    # Check if testing specific demonstration case (e.g. simulated unavailable service)
    if "UNAVAIL" in apaar_id:
        return {
            "status": "SERVICE_UNAVAILABLE",
            "message": "Demonstration Mode: Gateway timed out simulating temporary API downtime.",
            "verification_ref": None,
            "is_simulated": True
        }

    return {
        "status": "VERIFIED",
        "message": "Demonstration Mode: Record successfully validated against simulated APAAR directory.",
        "verification_ref": f"APAAR-SIM-REF-{abs(hash(apaar_id)) % 1000000:06d}",
        "is_simulated": True
    }
