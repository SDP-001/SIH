from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    Institution, Student, ImportBatch, ImportBatchError,
    DuplicateAlert, CorrectionRequest, DataQualityMetric
)

DEFAULT_WEIGHTS = {
    "completeness": 0.25,     # Required fields filled
    "validation_clean": 0.20, # Absence of schema/format errors
    "duplicate_free": 0.20,   # Absence of cross-enrolment/duplicate alerts
    "correction_done": 0.10,  # Prompt resolution of flagged corrections
    "verified_apaar": 0.15,   # Enrolled students verified via APAAR
    "freshness": 0.10         # Timeliness of batch submission
}

class InstitutionDataQualityService:
    """
    Innovation 7: Transparent Institution Data-Quality Indicator (DQI).
    Calculates transparent, explainable sub-scores across 6 dimensions.
    Clearly discloses mathematical formulas, weighting coefficients, and disclaimers.
    Strictly follows non-punitive guidelines.
    """

    @classmethod
    def calculate_institution_dqi(
        cls,
        db: Session,
        institution_id: str,
        academic_year: str = "2024-2025",
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        inst = db.query(Institution).filter(Institution.id == institution_id).first()
        if not inst:
            raise ValueError("Institution not found")

        w = weights or DEFAULT_WEIGHTS

        # 1. Component 1: Required-Field Completeness
        students = db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.academic_year == academic_year
        ).all()
        total_students = len(students)

        if total_students == 0:
            # No data submitted yet
            completeness_score = 100.0
            val_error_rate = 0.0
            dup_rate = 0.0
            correction_completion = 100.0
            verification_rate = 0.0
            freshness_score = 100.0
        else:
            # Check mandatory fields completeness: name, reg, course, email, phone, dob, gender, apaar
            complete_count = 0
            for s in students:
                fields_ok = (
                    bool(s.student_name) and 
                    bool(s.institution_reg_num) and 
                    bool(s.email) and 
                    bool(s.phone) and 
                    bool(s.date_of_birth) and 
                    bool(s.apaar_id)
                )
                if fields_ok:
                    complete_count += 1
            completeness_score = round((complete_count / total_students) * 100, 1)

            # 2. Component 2: Validation Cleanliness Rate (inverse of error rate)
            records_with_errors = db.query(func.count(Student.id)).filter(
                Student.institution_id == institution_id,
                Student.academic_year == academic_year,
                Student.data_validation_status.in_(["ERROR", "WARNING"])
            ).scalar() or 0
            val_error_rate = round((records_with_errors / total_students) * 100, 1)

            # 3. Component 3: Duplicate Alert Rate
            dup_alerts_count = db.query(func.count(DuplicateAlert.id)).filter(
                (DuplicateAlert.institution_a_id == institution_id) |
                (DuplicateAlert.institution_b_id == institution_id),
                DuplicateAlert.status.in_(["NEW", "UNDER_REVIEW", "CONFIRMED_DUPLICATE"])
            ).scalar() or 0
            dup_rate = min(100.0, round((dup_alerts_count / total_students) * 100, 1))

            # 4. Component 4: Correction Completion Rate
            total_corrections = db.query(func.count(CorrectionRequest.id)).filter(
                CorrectionRequest.institution_id == institution_id
            ).scalar() or 0
            resolved_corrections = db.query(func.count(CorrectionRequest.id)).filter(
                CorrectionRequest.institution_id == institution_id,
                CorrectionRequest.status.in_(["APPROVED", "REJECTED"])
            ).scalar() or 0
            correction_completion = round((resolved_corrections / total_corrections) * 100, 1) if total_corrections > 0 else 100.0

            # 5. Component 5: APAAR Verification Rate
            verified_apaar = db.query(func.count(Student.id)).filter(
                Student.institution_id == institution_id,
                Student.academic_year == academic_year,
                Student.apaar_status == "VERIFIED"
            ).scalar() or 0
            verification_rate = round((verified_apaar / total_students) * 100, 1)

            # 6. Component 6: Submission Freshness (timeliness of updates)
            recent_batch = db.query(ImportBatch).filter(
                ImportBatch.institution_id == institution_id
            ).order_by(ImportBatch.created_at.desc()).first()
            if recent_batch:
                days_ago = (datetime.now(timezone.utc) - recent_batch.created_at.replace(tzinfo=timezone.utc)).days
                freshness_score = max(50.0, min(100.0, 100.0 - (days_ago * 0.5)))
            else:
                freshness_score = 80.0

        # Calculate Overall Composite DQI Score using documented formula:
        # DQI = (Completeness * w1) + ((100 - ValErrorRate) * w2) + ((100 - DupRate) * w3) + (CorrectionCompletion * w4) + (VerificationRate * w5) + (Freshness * w6)
        validation_clean_score = max(0.0, 100.0 - val_error_rate)
        duplicate_free_score = max(0.0, 100.0 - dup_rate)

        composite_dqi = (
            (completeness_score * w["completeness"]) +
            (validation_clean_score * w["validation_clean"]) +
            (duplicate_free_score * w["duplicate_free"]) +
            (correction_completion * w["correction_done"]) +
            (verification_rate * w["verified_apaar"]) +
            (freshness_score * w["freshness"])
        )
        composite_dqi = round(composite_dqi, 1)

        # Persist metric
        metric = DataQualityMetric(
            institution_id=institution_id,
            academic_year=academic_year,
            reporting_period=f"AY-{academic_year}-Q4",
            completeness_score=completeness_score,
            validation_error_rate=val_error_rate,
            duplicate_alert_rate=dup_rate,
            correction_completion_rate=correction_completion,
            verification_rate=verification_rate,
            freshness_score=freshness_score,
            overall_dqi_score=composite_dqi,
            formula_weights_json=w
        )
        db.add(metric)
        db.commit()

        return {
            "institution_id": inst.id,
            "institution_name": inst.name,
            "institution_code": inst.institution_code,
            "academic_year": academic_year,
            "reporting_period": f"AY {academic_year} (Live Evaluation)",
            "overall_dqi_score": composite_dqi,
            "rating_tier": (
                "EXCELLENT" if composite_dqi >= 90 else
                ("GOOD" if composite_dqi >= 75 else
                 ("SATISFACTORY" if composite_dqi >= 60 else "NEEDS_IMPROVEMENT"))
            ),
            "component_scores": {
                "completeness": {
                    "score": completeness_score,
                    "weight_pct": int(w["completeness"] * 100),
                    "description": "Percentage of enrolled students with all core identity, demographic, and contact fields filled."
                },
                "validation_cleanliness": {
                    "score": validation_clean_score,
                    "error_rate": val_error_rate,
                    "weight_pct": int(w["validation_clean"] * 100),
                    "description": "Records conforming to schema format, valid course codes, and valid identifier formats."
                },
                "duplicate_prevention": {
                    "score": duplicate_free_score,
                    "alert_rate": dup_rate,
                    "weight_pct": int(w["duplicate_free"] * 100),
                    "description": "Absence of internal duplicate registration numbers or cross-institution concurrent enrolments."
                },
                "correction_resolution": {
                    "score": correction_completion,
                    "weight_pct": int(w["correction_done"] * 100),
                    "description": "Prompt review and determination of student data correction and adjustment requests."
                },
                "apaar_verification": {
                    "score": verification_rate,
                    "weight_pct": int(w["verified_apaar"] * 100),
                    "description": "Proportion of active students authenticated through official or simulated APAAR directory."
                },
                "submission_freshness": {
                    "score": freshness_score,
                    "weight_pct": int(w["freshness"] * 100),
                    "description": "Frequency and timeliness of periodic student onboarding batch updates."
                }
            },
            "formula_explanation": (
                "Formula: DQI = (Completeness × 25%) + ((100 - ValidationErrorRate) × 20%) + "
                "((100 - DuplicateRate) × 20%) + (CorrectionCompletion × 10%) + "
                "(VerificationRate × 15%) + (Freshness × 10%)"
            ),
            "disclaimer": (
                "Important Regulatory Notice: The Data Quality Index (DQI) is an internal data hygiene and completeness "
                "indicator. It is NOT an official AICTE accreditation rating and must not be used as sole grounds for punitive decisions."
            )
        }
