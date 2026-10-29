import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database
from app.models.models import (
    User, Institution, ApprovedIntake, ApprovedIntakeRevision, 
    Student, DuplicateAlert, AnomalyAlert, ValidationRuleConfig, CorrectionRequest
)
from app.core.security import verify_password, create_access_token, decode_access_token
from app.services.validation_service import mask_apaar_id, validate_apaar_format, check_duplicate_enrolment
from app.services.validation_engine import ExplainableValidationEngine, init_default_validation_rules
from app.services.admission_monitoring_service import SmartAdmissionMonitoringService
from app.services.anomaly_detection_service import AIAnomalyDetectionService
from app.services.officer_assistant_service import AICTEOfficerAssistantService
from app.services.data_quality_service import InstitutionDataQualityService
from app.services.report_generator_service import RegulatoryReportGeneratorService

def run_tests():
    print("Step 1: Resetting and recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Step 2: Running demonstration seeder...")
    result = seed_database(db)
    print("Seed result:", result)

    print("Step 3: Initializing default validation rules...")
    init_default_validation_rules(db)
    rules_count = db.query(ValidationRuleConfig).count()
    print(f"Validation Rules configured: {rules_count}")
    assert rules_count >= 5, "Expected at least 5 validation rules"

    print("Step 4: Checking seeded entities...")
    inst_count = db.query(Institution).count()
    user_count = db.query(User).count()
    intake_count = db.query(ApprovedIntake).count()
    student_count = db.query(Student).count()
    dup_count = db.query(DuplicateAlert).count()

    print(f"Institutions: {inst_count}")
    print(f"Users: {user_count}")
    print(f"Intakes: {intake_count}")
    print(f"Students: {student_count}")
    print(f"Duplicate Alerts: {dup_count}")

    assert inst_count >= 3, "Expected at least 3 institutions"
    assert user_count >= 7, "Expected at least 7 users"
    assert student_count >= 4, "Expected at least 4 students"
    assert dup_count >= 1, "Expected at least 1 duplicate alert"

    print("Step 5: Testing password verification...")
    user = db.query(User).filter(User.email == "aicte.admin@aicte.gov.in").first()
    assert user is not None, "AICTE Admin user missing"
    assert verify_password("Aicte@12345", user.hashed_password), "Password check failed"
    assert not verify_password("WrongPassword", user.hashed_password), "Invalid password check failed"
    print("Password authentication test PASSED!")

    print("Step 6: Testing JWT token generation and decoding...")
    token = create_access_token(subject=user.id, roles=["AICTE_ADMIN"])
    payload = decode_access_token(token)
    assert payload["sub"] == user.id, "JWT subject mismatch"
    assert "AICTE_ADMIN" in payload["roles"], "JWT roles mismatch"
    print("JWT token test PASSED!")

    print("Step 7: Testing APAAR masking and validation...")
    masked = mask_apaar_id("SIM-APAAR-2024-984210")
    print(f"Masked APAAR: {masked}")
    assert "****" in masked, "Masking failed"

    is_valid, _ = validate_apaar_format("SIM-APAAR-2024-984210")
    assert is_valid, "Simulated format should be valid"

    is_valid_num, _ = validate_apaar_format("123456789012")
    assert is_valid_num, "12-digit format should be valid"

    is_invalid, _ = validate_apaar_format("bad-format")
    assert not is_invalid, "Bad format should be rejected"
    print("APAAR format validation test PASSED!")

    print("Step 8: Testing Intake Capacity & Historical Revision (Rule 9)...")
    excess_intake = db.query(ApprovedIntake).filter(ApprovedIntake.actual_enrolment > ApprovedIntake.approved_intake).first()
    assert excess_intake is not None, "Expected excess intake for demonstration"
    print(f"Excess Intake Verified: Approved {excess_intake.approved_intake}, Actual {excess_intake.actual_enrolment}")

    # Test Rule 9: Record intake revision
    rev = SmartAdmissionMonitoringService.record_intake_revision(
        db=db,
        intake=excess_intake,
        new_approved=75,
        new_supernumerary=8,
        approval_reference="AICTE-EOA-REVISED-2024-25",
        reason="Sanction capacity expanded per AICTE Executive Committee approval",
        user_id=user.id
    )
    assert rev.previous_approved_intake == 60, "Revision previous intake mismatch"
    assert rev.new_approved_intake == 75, "Revision new intake mismatch"
    assert excess_intake.approved_intake == 75, "Current intake record not updated"
    rev_count = db.query(ApprovedIntakeRevision).count()
    assert rev_count >= 1, "Expected intake revision to be persisted"
    # Restore approved_intake back to 60 so demonstration excess intake remains active
    excess_intake.approved_intake = 60
    db.commit()
    print(f"Rule 9 Intake Revision test PASSED! Logged revision from 60 to 75 seats (restored to 60 for demo).")

    print("Step 9: Testing Explainable Validation Engine (Innovation 3)...")
    inst1 = db.query(Institution).first()
    sample_rec = {
        "student_name": "Rohan Deshmukh",
        "institution_reg_num": "BT-2024-TEST-99",
        "course_code": "BT-CSE",
        "academic_year": "2024-2025",
        "admission_year": 2024,
        "apaar_id": "SIM-APAAR-2024-888888",
        "email": "rohan@example.edu.in",
        "phone": "+91-9876509999"
    }
    val_results = ExplainableValidationEngine.validate_student_record(
        db=db,
        record=sample_rec,
        institution_id=inst1.id,
        save_results=True
    )
    assert len(val_results) > 0, "Expected validation results"
    pass_count = sum(1 for v in val_results if v["result"] == "PASS")
    print(f"Explainable Validation Engine test PASSED! ({len(val_results)} checks executed, {pass_count} passed).")

    print("Step 10: Testing AICTE Officer Assistant (Innovation 6)...")
    assistant_res = AICTEOfficerAssistantService.process_query(
        db=db,
        current_user=user,
        question="Which institutions have intake discrepancies?"
    )
    assert assistant_res["structured_intent"] == "INTAKE_DISCREPANCY_INSPECTION"
    assert "summary_answer" in assistant_res
    print(f"Officer Assistant test PASSED! Intent: {assistant_res['structured_intent']}")

    print("Step 11: Testing Data Quality Index (Innovation 7)...")
    dqi = InstitutionDataQualityService.calculate_institution_dqi(
        db=db,
        institution_id=inst1.id
    )
    assert "overall_dqi_score" in dqi
    assert "component_scores" in dqi
    print(f"Data Quality Index test PASSED! Institution DQI: {dqi['overall_dqi_score']}/100 ({dqi['rating_tier']})")

    print("Step 12: Testing Regulatory Report Generator (Innovation 8)...")
    rep_rows = RegulatoryReportGeneratorService.generate_report_data(
        db=db,
        report_type="institution_enrolment"
    )
    assert len(rep_rows) > 0, "Expected institution enrolment report rows"
    csv_str = RegulatoryReportGeneratorService.export_csv(rep_rows)
    assert "Institution Name" in csv_str
    print(f"Regulatory Report Generator test PASSED! Exported {len(rep_rows)} rows to CSV.")

    db.close()
    print("ALL BACKEND INNOVATION & REGULATORY VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()

