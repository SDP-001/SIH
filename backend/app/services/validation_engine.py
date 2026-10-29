import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import (
    ValidationRuleConfig, ValidationResult, Course, Institution, ApprovedIntake, Student
)
from app.services.validation_service import mask_apaar_id, validate_apaar_format

DEFAULT_VALIDATION_RULES = [
    {
        "rule_id": "VAL-REQ-001",
        "rule_name": "Mandatory Fields Completeness",
        "category": "MANDATORY_FIELDS",
        "severity": "ERROR",
        "description": "Verifies that core student identifiers (Name, Reg Number, Course Code, Academic Year, Admission Year) are present.",
        "rule_version": "v1.2",
        "suggested_action_template": "Provide all mandatory fields for the affected student record in the institutional submission."
    },
    {
        "rule_id": "VAL-FMT-002",
        "rule_name": "Identifier & Contact Format Validation",
        "category": "FORMAT",
        "severity": "ERROR",
        "description": "Validates format of APAAR ID (12-digit standard or demo SIM-APAAR standard), institutional registration number, email, and phone number.",
        "rule_version": "v1.2",
        "suggested_action_template": "Verify identifier syntax: APAAR ID must be 12 numeric digits (or test format SIM-APAAR-YYYY-XXXXXX); verify email standard."
    },
    {
        "rule_id": "VAL-CRS-003",
        "rule_name": "Course & Program Accreditation Integrity",
        "category": "INTEGRITY",
        "severity": "CRITICAL",
        "description": "Ensures the submitted course code exists in the institution's approved curriculum registry.",
        "rule_version": "v1.0",
        "suggested_action_template": "Map student record to an existing AICTE-approved course code within your institutional profile."
    },
    {
        "rule_id": "VAL-DUP-004",
        "rule_name": "Duplicate Enrolment Prevention",
        "category": "DUPLICATE",
        "severity": "CRITICAL",
        "description": "Identifies duplicate registration numbers within batch or cross-institution concurrent enrolments under identical APAAR identifier.",
        "rule_version": "v1.3",
        "suggested_action_template": "Review duplicate triage alert in regulatory portal; investigate with partner institution before consequential action."
    },
    {
        "rule_id": "VAL-CAP-005",
        "rule_name": "Sanctioned Intake Capacity Compliance",
        "category": "CAPACITY",
        "severity": "WARNING",
        "description": "Compares reported cumulative student admissions against AICTE-sanctioned regular and supernumerary intake quotas.",
        "rule_version": "v1.1",
        "suggested_action_template": "Review supernumerary seat classifications (TFW, EWS, J&K, PMSSS) and verify AICTE Extension of Approval (EoA) reference."
    },
    {
        "rule_id": "VAL-YEAR-006",
        "rule_name": "Academic Year & Admission Year Consistency",
        "category": "INTEGRITY",
        "severity": "WARNING",
        "description": "Flags discrepancies between academic year (e.g. 2024-2025) and entry admission year (e.g. 2024).",
        "rule_version": "v1.0",
        "suggested_action_template": "Align admission year with the starting year of the academic cycle."
    },
    {
        "rule_id": "VAL-APAAR-007",
        "rule_name": "APAAR Identifier Presence & Verification Status",
        "category": "INTEGRITY",
        "severity": "INFO",
        "description": "Surfaces records without an APAAR ID or records awaiting verification against authorized APAAR directory.",
        "rule_version": "v1.0",
        "suggested_action_template": "Initiate APAAR onboarding for eligible enrolled students through ABC/DigiLocker ecosystem."
    }
]

def init_default_validation_rules(db: Session):
    """
    Initializes standard regulatory validation rules in database if not present.
    """
    for r in DEFAULT_VALIDATION_RULES:
        existing = db.query(ValidationRuleConfig).filter(ValidationRuleConfig.rule_id == r["rule_id"]).first()
        if not existing:
            cfg = ValidationRuleConfig(
                rule_id=r["rule_id"],
                rule_name=r["rule_name"],
                category=r["category"],
                severity=r["severity"],
                description=r["description"],
                rule_version=r["rule_version"],
                is_active=True,
                suggested_action_template=r["suggested_action_template"]
            )
            db.add(cfg)
    db.commit()

class ExplainableValidationEngine:
    """
    Deterministic Explainable Validation Engine.
    Evaluates individual student records or batch submissions against configurable rules,
    producing structured explainability results with Rule ID, version, severity, inputs,
    human explanation, and suggested corrective action.
    """

    @classmethod
    def validate_student_record(
        cls,
        db: Session,
        record: Dict[str, Any],
        institution_id: str,
        student_id: Optional[str] = None,
        batch_id: Optional[str] = None,
        save_results: bool = True
    ) -> List[Dict[str, Any]]:
        results = []
        now = datetime.now(timezone.utc)

        # Retrieve active rules
        rules = {r.rule_id: r for r in db.query(ValidationRuleConfig).filter(ValidationRuleConfig.is_active == True).all()}

        s_name = str(record.get("student_name", "")).strip()
        s_reg = str(record.get("institution_reg_num", "")).strip()
        c_code = str(record.get("course_code", "")).strip().upper()
        acad_year = str(record.get("academic_year", "")).strip()
        adm_year = record.get("admission_year")
        apaar = str(record.get("apaar_id", "")).strip() if record.get("apaar_id") else None
        email = str(record.get("email", "")).strip() if record.get("email") else None
        phone = str(record.get("phone", "")).strip() if record.get("phone") else None
        is_sup = record.get("is_supernumerary", False)
        sup_cat = record.get("supernumerary_category")

        rec_ref = f"{s_name or 'Unknown'} ({s_reg or 'No-Reg'})"

        # --- Rule 1: Mandatory Fields Completeness (VAL-REQ-001) ---
        r1 = rules.get("VAL-REQ-001")
        if r1:
            missing = []
            if not s_name: missing.append("student_name")
            if not s_reg: missing.append("institution_reg_num")
            if not c_code: missing.append("course_code")
            if not acad_year: missing.append("academic_year")
            if not adm_year: missing.append("admission_year")

            if missing:
                res = {
                    "rule_id": r1.rule_id,
                    "rule_version": r1.rule_version,
                    "affected_record_reference": rec_ref,
                    "severity": r1.severity,
                    "input_values": {"missing_fields": missing},
                    "result": "FAIL",
                    "explanation": f"Mandatory student fields are missing: {', '.join(missing)}.",
                    "suggested_action": r1.suggested_action_template
                }
                results.append(res)
            else:
                results.append({
                    "rule_id": r1.rule_id,
                    "rule_version": r1.rule_version,
                    "affected_record_reference": rec_ref,
                    "severity": "INFO",
                    "input_values": {"status": "all_present"},
                    "result": "PASS",
                    "explanation": "All mandatory identity and enrolment fields are populated.",
                    "suggested_action": "No action needed."
                })

        # --- Rule 2: Format Validation (VAL-FMT-002) ---
        r2 = rules.get("VAL-FMT-002")
        if r2:
            format_issues = []
            if apaar:
                is_valid_apaar, apaar_msg = validate_apaar_format(apaar)
                if not is_valid_apaar:
                    format_issues.append(f"APAAR syntax: {apaar_msg}")

            if email and not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
                format_issues.append("Email address does not adhere to standard RFC format.")

            if phone and not re.match(r"^(\+91[\-\s]?)?[6-9]\d{9}$", phone.replace(" ", "")):
                format_issues.append("Phone number does not match standard 10-digit Indian mobile format.")

            if format_issues:
                results.append({
                    "rule_id": r2.rule_id,
                    "rule_version": r2.rule_version,
                    "affected_record_reference": rec_ref,
                    "severity": r2.severity,
                    "input_values": {"apaar_masked": mask_apaar_id(apaar), "issues": format_issues},
                    "result": "FAIL",
                    "explanation": f"Field format irregularities detected: {'; '.join(format_issues)}",
                    "suggested_action": r2.suggested_action_template
                })
            else:
                results.append({
                    "rule_id": r2.rule_id,
                    "rule_version": r2.rule_version,
                    "affected_record_reference": rec_ref,
                    "severity": "INFO",
                    "input_values": {"apaar_masked": mask_apaar_id(apaar)},
                    "result": "PASS",
                    "explanation": "Identifier and contact field formats are valid.",
                    "suggested_action": "No action needed."
                })

        # --- Rule 3: Course Accreditation (VAL-CRS-003) ---
        r3 = rules.get("VAL-CRS-003")
        course_obj = None
        if r3 and c_code:
            course_obj = db.query(Course).filter(
                Course.institution_id == institution_id,
                Course.course_code.ilike(c_code)
            ).first()

            if not course_obj:
                results.append({
                    "rule_id": r3.rule_id,
                    "rule_version": r3.rule_version,
                    "affected_record_reference": rec_ref,
                    "severity": r3.severity,
                    "input_values": {"provided_course_code": c_code, "institution_id": institution_id},
                    "result": "FAIL",
                    "explanation": f"Course code '{c_code}' is not an approved program under institution profile.",
                    "suggested_action": r3.suggested_action_template
                })
            else:
                results.append({
                    "rule_id": r3.rule_id,
                    "rule_version": r3.rule_version,
                    "affected_record_reference": rec_ref,
                    "severity": "INFO",
                    "input_values": {"matched_course": course_obj.course_name},
                    "result": "PASS",
                    "explanation": f"Mapped to approved course '{course_obj.course_name}' ({course_obj.course_code}).",
                    "suggested_action": "No action needed."
                })

        # --- Rule 5: Intake Capacity Check (VAL-CAP-005) ---
        r5 = rules.get("VAL-CAP-005")
        if r5 and course_obj and acad_year:
            intake = db.query(ApprovedIntake).filter(
                ApprovedIntake.institution_id == institution_id,
                ApprovedIntake.course_id == course_obj.id,
                ApprovedIntake.academic_year == acad_year
            ).first()

            if intake:
                if intake.actual_enrolment > intake.approved_intake:
                    excess = intake.actual_enrolment - intake.approved_intake
                    pct = round((excess / intake.approved_intake) * 100, 1) if intake.approved_intake > 0 else 100
                    results.append({
                        "rule_id": r5.rule_id,
                        "rule_version": r5.rule_version,
                        "affected_record_reference": rec_ref,
                        "severity": "WARNING",
                        "input_values": {
                            "approved_intake": intake.approved_intake,
                            "actual_enrolment": intake.actual_enrolment,
                            "supernumerary_quota": intake.supernumerary_quota,
                            "supernumerary_enrolled": intake.supernumerary_enrolled,
                            "excess_seats": excess
                        },
                        "result": "FLAG",
                        "explanation": f"Reported program enrolment ({intake.actual_enrolment}) exceeds configured approved intake ({intake.approved_intake}) by {excess} seats ({pct}% excess).",
                        "suggested_action": "Confirm the applicable approval and seat-category rules (TFW/EWS/PMSSS), then review the reported admissions."
                    })

        # --- Rule 6: Academic Year Consistency (VAL-YEAR-006) ---
        r6 = rules.get("VAL-YEAR-006")
        if r6 and acad_year and adm_year:
            try:
                start_year = int(acad_year.split("-")[0])
                adm_int = int(adm_year)
                if adm_int != start_year and adm_int < start_year - 4:
                    results.append({
                        "rule_id": r6.rule_id,
                        "rule_version": r6.rule_version,
                        "affected_record_reference": rec_ref,
                        "severity": r6.severity,
                        "input_values": {"academic_year": acad_year, "admission_year": adm_int},
                        "result": "FLAG",
                        "explanation": f"Admission year ({adm_int}) has high deviation from academic cycle ({acad_year}).",
                        "suggested_action": r6.suggested_action_template
                    })
            except Exception:
                pass

        # Save results to DB if requested
        if save_results:
            for item in results:
                db_res = ValidationResult(
                    rule_id=item["rule_id"],
                    rule_version=item["rule_version"],
                    affected_record_reference=item["affected_record_reference"],
                    severity=item["severity"],
                    input_values_json=item["input_values"],
                    result=item["result"],
                    human_explanation=item["explanation"],
                    suggested_action=item["suggested_action"],
                    institution_id=institution_id,
                    student_id=student_id,
                    batch_id=batch_id,
                    created_at=now
                )
                db.add(db_res)
            db.commit()

        return results
