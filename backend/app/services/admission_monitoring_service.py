from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    ApprovedIntake, ApprovedIntakeRevision, Course, Institution, 
    Department, Student, AuditLog, User
)

class SmartAdmissionMonitoringService:
    """
    Innovation 2: Smart Admission Monitoring Engine.
    Performs deterministic capacity calculation, supernumerary category breakdown,
    preserves intake revision history (Rule 9), and generates explainable discrepancy alerts.
    """

    @classmethod
    def calculate_intake_discrepancy(
        cls,
        approved_intake: int,
        reported_enrolment: int,
        supernumerary_quota: int,
        supernumerary_enrolled: int,
        supernumerary_counted_in_sanction: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates admission capacity metrics respecting supernumerary counting rules.
        By default under AICTE norms, supernumerary seats (TFW, EWS, J&K, PMSSS) are over and above sanctioned intake,
        unless specified by particular state policy.
        """
        # Regular admissions = total enrolled - supernumerary enrolled
        regular_enrolled = max(0, reported_enrolment - supernumerary_enrolled)
        
        if supernumerary_counted_in_sanction:
            effective_capacity = approved_intake + supernumerary_quota
            effective_enrolled = reported_enrolment
            excess = max(0, effective_enrolled - effective_capacity)
            utilization_pct = round((effective_enrolled / effective_capacity) * 100, 1) if effective_capacity > 0 else 0
        else:
            # Regular seats compared to sanctioned intake; supernumerary evaluated against separate quota
            effective_capacity = approved_intake
            excess = max(0, regular_enrolled - approved_intake)
            utilization_pct = round((regular_enrolled / approved_intake) * 100, 1) if approved_intake > 0 else 0

        supernumerary_excess = max(0, supernumerary_enrolled - supernumerary_quota)

        is_discrepant = excess > 0 or supernumerary_excess > 0

        severity = "COMPLIANT"
        if excess > 0:
            severity = "CRITICAL" if (excess / approved_intake) > 0.20 else "HIGH"
        elif supernumerary_excess > 0:
            severity = "MEDIUM"
        elif utilization_pct >= 95:
            severity = "NEAR_CAPACITY"

        return {
            "is_discrepant": is_discrepant,
            "severity": severity,
            "approved_intake": approved_intake,
            "reported_enrolment": reported_enrolment,
            "regular_enrolled": regular_enrolled,
            "supernumerary_quota": supernumerary_quota,
            "supernumerary_enrolled": supernumerary_enrolled,
            "regular_excess": excess,
            "supernumerary_excess": supernumerary_excess,
            "utilization_percentage": utilization_pct,
            "calculation_notes": (
                f"Calculation: Reported total {reported_enrolment} = {regular_enrolled} regular + {supernumerary_enrolled} supernumerary. "
                f"Approved regular capacity: {approved_intake}. "
                + (f"Discrepancy: +{excess} seats exceed regular sanctioned quota." if excess > 0 else "Regular intake within sanctioned limit.")
            )
        }

    @classmethod
    def get_admission_alerts(
        cls,
        db: Session,
        institution_id: Optional[str] = None,
        academic_year: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates structured explainable admission alerts for all programs where reported admissions exceed quotas.
        """
        query = db.query(
            ApprovedIntake, Course, Institution, Department
        ).join(
            Course, ApprovedIntake.course_id == Course.id
        ).join(
            Institution, ApprovedIntake.institution_id == Institution.id
        ).outerjoin(
            Department, Course.department_id == Department.id
        )

        if institution_id:
            query = query.filter(ApprovedIntake.institution_id == institution_id)
        if academic_year:
            query = query.filter(ApprovedIntake.academic_year == academic_year)

        intakes = query.all()
        alerts = []

        for intake, course, inst, dept in intakes:
            calc = cls.calculate_intake_discrepancy(
                approved_intake=intake.approved_intake,
                reported_enrolment=intake.actual_enrolment,
                supernumerary_quota=intake.supernumerary_quota,
                supernumerary_enrolled=intake.supernumerary_enrolled
            )

            if calc["is_discrepant"]:
                # Fetch breakdown of supernumerary student categories
                cat_counts = db.query(
                    Student.supernumerary_category,
                    func.count(Student.id)
                ).filter(
                    Student.institution_id == intake.institution_id,
                    Student.course_id == intake.course_id,
                    Student.academic_year == intake.academic_year,
                    Student.is_supernumerary == True
                ).group_by(Student.supernumerary_category).all()

                cat_breakdown = {c[0] or "UNSPECIFIED": c[1] for c in cat_counts}

                alerts.append({
                    "alert_id": f"INTAKE-ALT-{intake.id[:8].upper()}",
                    "intake_id": intake.id,
                    "institution_id": inst.id,
                    "institution_code": inst.institution_code,
                    "institution_name": inst.name,
                    "department_name": dept.name if dept else "General",
                    "course_id": course.id,
                    "course_name": course.course_name,
                    "course_code": course.course_code,
                    "academic_year": intake.academic_year,
                    "approved_intake_reference": intake.approval_order_ref or inst.aicte_approval_ref,
                    "approved_intake": intake.approved_intake,
                    "reported_enrolment": intake.actual_enrolment,
                    "regular_enrolled": calc["regular_enrolled"],
                    "supernumerary_quota": intake.supernumerary_quota,
                    "supernumerary_enrolled": intake.supernumerary_enrolled,
                    "supernumerary_category_breakdown": cat_breakdown,
                    "discrepancy_seats": calc["regular_excess"],
                    "excess_seats": calc["regular_excess"],
                    "excess_percentage": calc["utilization_percentage"],
                    "supernumerary_excess_seats": calc["supernumerary_excess"],
                    "utilization_percentage": calc["utilization_percentage"],
                    "severity": calc["severity"],
                    "calculation": calc["calculation_notes"],
                    "review_status": "UNDER_REVIEW" if calc["severity"] == "CRITICAL" else "NEW",
                    "recommended_verification_steps": [
                        "1. Verify AICTE Extension of Approval (EoA) letter for the specific academic year.",
                        "2. Verify State Directorate of Technical Education (DTE) seat matrix allotment letters.",
                        "3. Check whether excess admissions represent approved Tuition Fee Waiver (TFW), EWS, or PMSSS supernumerary categories.",
                        "4. Issue clarification request to institutional registrar if unallocated regular admissions exist."
                    ]
                })

        return alerts

    @classmethod
    def record_intake_revision(
        cls,
        db: Session,
        intake: ApprovedIntake,
        new_approved: int,
        new_supernumerary: int,
        approval_reference: str,
        reason: str,
        user_id: Optional[str]
    ) -> ApprovedIntakeRevision:
        """
        Enforces Rule 9: Do not overwrite historical approved-intake records without preserving change history.
        """
        revision = ApprovedIntakeRevision(
            approved_intake_id=intake.id,
            institution_id=intake.institution_id,
            course_id=intake.course_id,
            academic_year=intake.academic_year,
            previous_approved_intake=intake.approved_intake,
            new_approved_intake=new_approved,
            previous_supernumerary=intake.supernumerary_quota,
            new_supernumerary=new_supernumerary,
            approval_reference_number=approval_reference,
            revision_reason=reason,
            revised_by_user_id=user_id
        )
        db.add(revision)

        # Update current record
        intake.approved_intake = new_approved
        intake.supernumerary_quota = new_supernumerary
        intake.approval_order_ref = approval_reference
        intake.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(revision)
        return revision
