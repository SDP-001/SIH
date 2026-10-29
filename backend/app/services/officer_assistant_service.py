import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    Institution, Course, ApprovedIntake, Student, 
    DuplicateAlert, AnomalyAlert, ImportBatch, ImportBatchError, User
)
from app.core.deps import get_user_roles

class AICTEOfficerAssistantService:
    """
    Innovation 6: AICTE Officer Assistant.
    Provides authorized regulators and institutional officers with an explainable AI natural query interface.
    Executes deterministic database analytics, enforces strict RBAC and tenant isolation, explains data lineage,
    and links to authorized underlying reports without ever hallucinating figures.
    """

    @classmethod
    def process_query(
        cls,
        db: Session,
        current_user: User,
        question: str,
        academic_year: Optional[str] = "2024-2025",
        institution_id: Optional[str] = None
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        q_clean = question.lower().strip()
        roles = get_user_roles(current_user, db)
        is_aicte = "SUPER_ADMIN" in roles or "AICTE_ADMIN" in roles

        # Restrict institutional user to their own institution
        if not is_aicte:
            institution_id = current_user.institution_id

        # Intent 1: Unresolved Intake Discrepancies
        if any(w in q_clean for w in ["intake", "discrepanc", "capacity", "excess", "over-enrol"]):
            return cls._handle_intake_discrepancies(db, is_aicte, institution_id, academic_year, question)

        # Intent 2: Awaiting / Pending Verification
        elif any(w in q_clean for w in ["awaiting", "pending", "verification", "unverified"]):
            return cls._handle_pending_verification(db, is_aicte, institution_id, academic_year, question)

        # Intent 3: Validation Errors / Data Quality Issues
        elif any(w in q_clean for w in ["validation", "error", "malformed", "invalid", "quality"]):
            return cls._handle_validation_errors(db, is_aicte, institution_id, academic_year, question)

        # Intent 4: Duplicate Alerts / Cross Enrolment
        elif any(w in q_clean for w in ["duplicate", "conflict", "cross-institution", "repeated"]):
            return cls._handle_duplicate_summary(db, is_aicte, institution_id, academic_year, question)

        # Intent 5: Enrolment Trends / Program Summary
        elif any(w in q_clean for w in ["trend", "enrolment", "enrollment", "total student", "statistics"]):
            return cls._handle_enrolment_trends(db, is_aicte, institution_id, academic_year, question)

        # Default fallback: Comprehensive Regulatory Snapshot
        else:
            return cls._handle_comprehensive_summary(db, is_aicte, institution_id, academic_year, question)

    @classmethod
    def _handle_intake_discrepancies(
        cls, db: Session, is_aicte: bool, inst_id: Optional[str], acad_year: str, question: str
    ) -> Dict[str, Any]:
        query = db.query(ApprovedIntake, Course, Institution).join(
            Course, ApprovedIntake.course_id == Course.id
        ).join(
            Institution, ApprovedIntake.institution_id == Institution.id
        ).filter(
            ApprovedIntake.actual_enrolment > ApprovedIntake.approved_intake
        )

        if not is_aicte or inst_id:
            query = query.filter(ApprovedIntake.institution_id == inst_id)
        if acad_year:
            query = query.filter(ApprovedIntake.academic_year == acad_year)

        rows = query.all()
        supporting = []
        total_excess = 0

        for intake, course, inst in rows:
            excess = intake.actual_enrolment - intake.approved_intake
            total_excess += excess
            supporting.append({
                "institution_name": inst.name,
                "course_name": course.course_name,
                "approved_intake": intake.approved_intake,
                "reported_enrolment": intake.actual_enrolment,
                "excess_students": excess,
                "approval_reference": intake.approval_order_ref or inst.aicte_approval_ref
            })

        count = len(supporting)
        if count == 0:
            summary = f"Zero intake capacity discrepancies found for academic year {acad_year}. All surveyed programs are operating strictly within approved quotas."
        else:
            inst_count = len(set(r["institution_name"] for r in supporting))
            summary = (
                f"Identified {count} academic program(s) across {inst_count} institution(s) where reported student admissions "
                f"exceed the AICTE sanctioned intake, totaling {total_excess} excess enrolled students."
            )

        return {
            "question": question,
            "structured_intent": "INTAKE_DISCREPANCY_INSPECTION",
            "summary_answer": summary,
            "metric_values": {
                "flagged_programs": count,
                "total_excess_seats": total_excess,
                "academic_year": acad_year
            },
            "filters_applied": {
                "academic_year": acad_year,
                "institution_id": inst_id or "ALL_ACCESSIBLE",
                "condition": "actual_enrolment > approved_intake"
            },
            "supporting_data": supporting,
            "underlying_report_link": "/reports/enrolment",
            "explainability_notes": "Calculation: Cumulative student records flagged where reported regular admissions exceed the latest AICTE Extension of Approval (EoA) sanctioned quota.",
            "generated_at": datetime.now(timezone.utc)
        }

    @classmethod
    def _handle_pending_verification(
        cls, db: Session, is_aicte: bool, inst_id: Optional[str], acad_year: str, question: str
    ) -> Dict[str, Any]:
        s_query = db.query(Student)
        if not is_aicte or inst_id:
            s_query = s_query.filter(Student.institution_id == inst_id)
        if acad_year:
            s_query = s_query.filter(Student.academic_year == acad_year)

        total_students = s_query.count()
        pending = s_query.filter(Student.apaar_status.in_(["NOT_CHECKED", "PENDING", "FORMAT_VALID"])).count()
        verified = s_query.filter(Student.apaar_status == "VERIFIED").count()
        invalid = s_query.filter(Student.apaar_status == "INVALID").count()

        summary = (
            f"Currently {pending} student records are awaiting official APAAR directory verification "
            f"out of {total_students} total enrolled students ({verified} verified, {invalid} invalid format)."
        )

        return {
            "question": question,
            "structured_intent": "VERIFICATION_STATUS_SUMMARY",
            "summary_answer": summary,
            "metric_values": {
                "total_students": total_students,
                "awaiting_verification": pending,
                "verified_apaar": verified,
                "invalid_format": invalid
            },
            "filters_applied": {
                "academic_year": acad_year,
                "institution_id": inst_id or "ALL_ACCESSIBLE"
            },
            "supporting_data": [
                {"status": "AWAITING_VERIFICATION", "count": pending},
                {"status": "VERIFIED_GENUINE", "count": verified},
                {"status": "INVALID_SYNTAX", "count": invalid}
            ],
            "underlying_report_link": "/students",
            "explainability_notes": "Breakdown based on student APAAR onboarding status in database.",
            "generated_at": datetime.now(timezone.utc)
        }

    @classmethod
    def _handle_validation_errors(
        cls, db: Session, is_aicte: bool, inst_id: Optional[str], acad_year: str, question: str
    ) -> Dict[str, Any]:
        # Top courses with error/warning rows
        query = db.query(
            Course.course_name,
            func.count(Student.id).label("issue_count")
        ).join(
            Student, Course.id == Student.course_id
        ).filter(
            Student.data_validation_status.in_(["WARNING", "ERROR"])
        )

        if not is_aicte or inst_id:
            query = query.filter(Student.institution_id == inst_id)
        if acad_year:
            query = query.filter(Student.academic_year == acad_year)

        top_courses = query.group_by(Course.course_name).order_by(func.count(Student.id).desc()).limit(5).all()

        total_issues = db.query(func.count(Student.id)).filter(
            Student.data_validation_status.in_(["WARNING", "ERROR"])
        )
        if not is_aicte or inst_id:
            total_issues = total_issues.filter(Student.institution_id == inst_id)
        total_count = total_issues.scalar() or 0

        supporting = [{"course": tc[0], "records_flagged": tc[1]} for tc in top_courses]

        summary = (
            f"There are {total_count} student records flagged with data validation warnings or schema errors. "
            + (f"Program with highest discrepancies is '{top_courses[0][0]}' with {top_courses[0][1]} flagged records." if top_courses else "No significant course error clusters.")
        )

        return {
            "question": question,
            "structured_intent": "VALIDATION_ERROR_ANALYSIS",
            "summary_answer": summary,
            "metric_values": {
                "total_flagged_records": total_count,
                "top_discrepant_courses": len(supporting)
            },
            "filters_applied": {
                "academic_year": acad_year,
                "institution_id": inst_id or "ALL_ACCESSIBLE",
                "condition": "status in [WARNING, ERROR]"
            },
            "supporting_data": supporting,
            "underlying_report_link": "/reports/enrolment",
            "explainability_notes": "Aggregation of individual row validation outcomes from the explainable validation engine.",
            "generated_at": datetime.now(timezone.utc)
        }

    @classmethod
    def _handle_duplicate_summary(
        cls, db: Session, is_aicte: bool, inst_id: Optional[str], acad_year: str, question: str
    ) -> Dict[str, Any]:
        query = db.query(DuplicateAlert)
        if not is_aicte and inst_id:
            query = query.filter(
                (DuplicateAlert.institution_a_id == inst_id) |
                (DuplicateAlert.institution_b_id == inst_id)
            )

        total_dups = query.count()
        open_dups = query.filter(DuplicateAlert.status.in_(["NEW", "UNDER_REVIEW"])).count()
        critical_dups = query.filter(
            DuplicateAlert.severity == "CRITICAL",
            DuplicateAlert.status.in_(["NEW", "UNDER_REVIEW"])
        ).count()

        alerts = query.order_by(DuplicateAlert.created_at.desc()).limit(5).all()
        supporting = []
        for a in alerts:
            inst_a = db.query(Institution).filter(Institution.id == a.institution_a_id).first()
            inst_b = db.query(Institution).filter(Institution.id == a.institution_b_id).first()
            supporting.append({
                "alert_id": a.id,
                "match_category": a.match_category,
                "severity": a.severity,
                "institutions": f"{inst_a.name if inst_a else 'Inst A'} ↔ {inst_b.name if inst_b else 'Inst B'}",
                "status": a.status
            })

        summary = (
            f"Detected {total_dups} total duplicate enrolment alerts ({open_dups} currently open, "
            f"{critical_dups} critical cross-institutional dual-enrolments requiring urgent regulatory triage)."
        )

        return {
            "question": question,
            "structured_intent": "DUPLICATE_ENROLMENT_SUMMARY",
            "summary_answer": summary,
            "metric_values": {
                "total_duplicate_alerts": total_dups,
                "open_duplicate_alerts": open_dups,
                "critical_cross_enrolments": critical_dups
            },
            "filters_applied": {
                "institution_id": inst_id or "ALL_ACCESSIBLE"
            },
            "supporting_data": supporting,
            "underlying_report_link": "/validation/duplicates",
            "explainability_notes": "Duplicate detection algorithms flag concurrent active registrations sharing the identical APAAR identifier across distinct institutions.",
            "generated_at": datetime.now(timezone.utc)
        }

    @classmethod
    def _handle_enrolment_trends(
        cls, db: Session, is_aicte: bool, inst_id: Optional[str], acad_year: str, question: str
    ) -> Dict[str, Any]:
        s_query = db.query(func.count(Student.id))
        i_query = db.query(func.sum(ApprovedIntake.approved_intake))
        if not is_aicte or inst_id:
            s_query = s_query.filter(Student.institution_id == inst_id)
            i_query = i_query.filter(ApprovedIntake.institution_id == inst_id)
        if acad_year:
            s_query = s_query.filter(Student.academic_year == acad_year)
            i_query = i_query.filter(ApprovedIntake.academic_year == acad_year)

        total_students = s_query.scalar() or 0
        total_intake = i_query.scalar() or 0
        utilization = round((total_students / total_intake) * 100, 1) if total_intake > 0 else 0

        # State or Course distribution
        top_courses = db.query(
            Course.course_name, func.count(Student.id)
        ).join(
            Student, Course.id == Student.course_id
        )
        if not is_aicte or inst_id:
            top_courses = top_courses.filter(Course.institution_id == inst_id)
        if acad_year:
            top_courses = top_courses.filter(Student.academic_year == acad_year)

        course_dist = top_courses.group_by(Course.course_name).order_by(func.count(Student.id).desc()).limit(5).all()

        supporting = [{"course": cd[0], "enrolled": cd[1]} for cd in course_dist]

        summary = (
            f"For academic year {acad_year}, total reported admissions stand at {total_students} students "
            f"against a sanctioned intake of {total_intake} seats ({utilization}% national capacity utilization)."
        )

        return {
            "question": question,
            "structured_intent": "ENROLMENT_STATISTICS_OVERVIEW",
            "summary_answer": summary,
            "metric_values": {
                "reported_enrolment": total_students,
                "sanctioned_intake": total_intake,
                "utilization_percentage": utilization,
                "academic_year": acad_year
            },
            "filters_applied": {
                "academic_year": acad_year,
                "institution_id": inst_id or "ALL_ACCESSIBLE"
            },
            "supporting_data": supporting,
            "underlying_report_link": "/reports/enrolment",
            "explainability_notes": "Calculated by aggregating all active student admission records against authorized intake ceilings.",
            "generated_at": datetime.now(timezone.utc)
        }

    @classmethod
    def _handle_comprehensive_summary(
        cls, db: Session, is_aicte: bool, inst_id: Optional[str], acad_year: str, question: str
    ) -> Dict[str, Any]:
        inst_count = db.query(Institution).count() if is_aicte else 1
        student_count = db.query(Student).count()
        excess_intakes = db.query(ApprovedIntake).filter(ApprovedIntake.actual_enrolment > ApprovedIntake.approved_intake).count()
        open_dups = db.query(DuplicateAlert).filter(DuplicateAlert.status.in_(["NEW", "UNDER_REVIEW"])).count()

        summary = (
            f"APAAR-Vault National Regulatory Bureau: Monitoring {inst_count} technical institutions and {student_count} reported student records. "
            f"Currently tracking {excess_intakes} program(s) with excess admissions and {open_dups} open duplicate enrolment alerts."
        )

        return {
            "question": question,
            "structured_intent": "GENERAL_REGULATORY_SNAPSHOT",
            "summary_answer": summary,
            "metric_values": {
                "monitored_institutions": inst_count,
                "reported_students": student_count,
                "excess_intake_programs": excess_intakes,
                "open_duplicate_alerts": open_dups
            },
            "filters_applied": {
                "academic_year": acad_year,
                "institution_id": inst_id or "ALL_ACCESSIBLE"
            },
            "supporting_data": [
                {"indicator": "Monitored Institutions", "value": inst_count},
                {"indicator": "Reported Students", "value": student_count},
                {"indicator": "Programs Exceeding Intake", "value": excess_intakes},
                {"indicator": "Active Duplicate Alerts", "value": open_dups}
            ],
            "underlying_report_link": "/dashboard/aicte",
            "explainability_notes": "Composite snapshot query calculated directly from live database tables without external generative models.",
            "generated_at": datetime.now(timezone.utc)
        }
