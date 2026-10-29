import io
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    Institution, Course, ApprovedIntake, ApprovedIntakeRevision, 
    Student, DuplicateAlert, ImportBatch, CorrectionRequest, AuditLog, User
)
from app.services.validation_service import mask_apaar_id

class RegulatoryReportGeneratorService:
    """
    Innovation 8: Regulatory Report Generator.
    Produces audit-tracked, privacy-conscious regulatory reports in CSV, XLSX, and formatted JSON formats
    across 8 mandatory regulatory dimensions.
    """

    REPORT_TYPES = {
        "institution_enrolment": "Institution-wise Enrolment Summary",
        "course_enrolment": "Course-wise Approved Intake vs Reported Enrolment",
        "intake_discrepancy": "Sanctioned Intake Capacity Violations & Alerts",
        "apaar_verification_status": "APAAR Identifier Onboarding & Verification Status",
        "duplicate_enrolments": "Potential Duplicate & Cross-Institution Enrolments",
        "data_quality_issues": "Data Validation Warnings & Integrity Flags",
        "pending_corrections": "Institutional Student Data Correction Requests",
        "intake_change_history": "Approved Intake Revisions & Change History Log"
    }

    @classmethod
    def generate_report_data(
        cls,
        db: Session,
        report_type: str,
        institution_id: Optional[str] = None,
        academic_year: Optional[str] = "2024-2025",
        state: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Queries actual database tables for structured reporting rows.
        Never fabricates sample metrics.
        """
        now = datetime.now(timezone.utc)

        # 1. Institution-wise Enrolment Summary
        if report_type == "institution_enrolment":
            query = db.query(
                Institution.institution_code,
                Institution.name.label("institution_name"),
                Institution.state,
                Institution.institution_type,
                func.sum(ApprovedIntake.approved_intake).label("total_approved_intake"),
                func.sum(ApprovedIntake.actual_enrolment).label("total_reported_enrolment"),
                func.sum(ApprovedIntake.supernumerary_enrolled).label("total_supernumerary")
            ).join(
                ApprovedIntake, Institution.id == ApprovedIntake.institution_id
            )
            if institution_id:
                query = query.filter(Institution.id == institution_id)
            if academic_year:
                query = query.filter(ApprovedIntake.academic_year == academic_year)
            if state:
                query = query.filter(Institution.state.ilike(f"%{state}%"))

            rows = query.group_by(
                Institution.institution_code, Institution.name, Institution.state, Institution.institution_type
            ).all()

            results = []
            for r in rows:
                approved = int(r.total_approved_intake or 0)
                enrolled = int(r.total_reported_enrolment or 0)
                excess = max(0, enrolled - approved)
                results.append({
                    "Institution Code": r.institution_code,
                    "Institution Name": r.institution_name,
                    "State": r.state,
                    "Type": r.institution_type,
                    "Academic Year": academic_year,
                    "Sanctioned Intake": approved,
                    "Reported Enrolment": enrolled,
                    "Supernumerary Enrolled": int(r.total_supernumerary or 0),
                    "Excess Admissions": excess,
                    "Compliance Status": "NON_COMPLIANT_EXCESS" if excess > 0 else "COMPLIANT"
                })
            return results

        # 2. Course-wise Enrolment & Intake
        elif report_type == "course_enrolment":
            query = db.query(
                Institution.name.label("institution_name"),
                Course.course_name,
                Course.course_code,
                Course.degree_level,
                ApprovedIntake.academic_year,
                ApprovedIntake.approved_intake,
                ApprovedIntake.actual_enrolment,
                ApprovedIntake.supernumerary_quota,
                ApprovedIntake.supernumerary_enrolled,
                ApprovedIntake.approval_order_ref
            ).join(
                Course, Institution.id == Course.institution_id
            ).join(
                ApprovedIntake, (Course.id == ApprovedIntake.course_id) & (Institution.id == ApprovedIntake.institution_id)
            )
            if institution_id:
                query = query.filter(Institution.id == institution_id)
            if academic_year:
                query = query.filter(ApprovedIntake.academic_year == academic_year)
            if state:
                query = query.filter(Institution.state.ilike(f"%{state}%"))

            rows = query.all()
            results = []
            for r in rows:
                excess = max(0, r.actual_enrolment - r.approved_intake)
                results.append({
                    "Institution Name": r.institution_name,
                    "Course Name": r.course_name,
                    "Course Code": r.course_code,
                    "Degree Level": r.degree_level,
                    "Academic Year": r.academic_year,
                    "Approved Intake": r.approved_intake,
                    "Reported Enrolment": r.actual_enrolment,
                    "Supernumerary Quota": r.supernumerary_quota,
                    "Supernumerary Enrolled": r.supernumerary_enrolled,
                    "Excess Intake": excess,
                    "Approval Reference": r.approval_order_ref or "AICTE-REGULAR-EOA",
                    "Capacity Status": "EXCESS" if excess > 0 else "COMPLIANT"
                })
            return results

        # 3. Intake Discrepancy Violations
        elif report_type == "intake_discrepancy":
            query = db.query(
                Institution.name.label("institution_name"),
                Course.course_name,
                ApprovedIntake.academic_year,
                ApprovedIntake.approved_intake,
                ApprovedIntake.actual_enrolment,
                ApprovedIntake.supernumerary_enrolled,
                ApprovedIntake.approval_order_ref
            ).join(
                Course, ApprovedIntake.course_id == Course.id
            ).join(
                Institution, ApprovedIntake.institution_id == Institution.id
            ).filter(
                ApprovedIntake.actual_enrolment > ApprovedIntake.approved_intake
            )
            if institution_id:
                query = query.filter(ApprovedIntake.institution_id == institution_id)
            if academic_year:
                query = query.filter(ApprovedIntake.academic_year == academic_year)

            rows = query.all()
            results = []
            for r in rows:
                excess = r.actual_enrolment - r.approved_intake
                pct = round((excess / r.approved_intake) * 100, 1) if r.approved_intake > 0 else 100
                results.append({
                    "Institution Name": r.institution_name,
                    "Course Name": r.course_name,
                    "Academic Year": r.academic_year,
                    "Approved Quota": r.approved_intake,
                    "Reported Admissions": r.actual_enrolment,
                    "Supernumerary Included": r.supernumerary_enrolled,
                    "Excess Seats": excess,
                    "Excess Percentage": f"{pct}%",
                    "Approval Ref": r.approval_order_ref or "AICTE-EOA",
                    "Severity": "CRITICAL" if pct > 20 else "HIGH",
                    "Action Required": "Authorized AICTE Intake Audit Required"
                })
            return results

        # 4. APAAR Verification Status Report
        elif report_type == "apaar_verification_status":
            query = db.query(
                Institution.name.label("institution_name"),
                Course.course_name,
                Student.student_name,
                Student.institution_reg_num,
                Student.academic_year,
                Student.apaar_status,
                Student.apaar_id,
                Student.apaar_verification_ref,
                Student.apaar_verified_at
            ).join(
                Institution, Student.institution_id == Institution.id
            ).join(
                Course, Student.course_id == Course.id
            )
            if institution_id:
                query = query.filter(Student.institution_id == institution_id)
            if academic_year:
                query = query.filter(Student.academic_year == academic_year)

            rows = query.all()
            results = []
            for r in rows:
                results.append({
                    "Institution Name": r.institution_name,
                    "Course Name": r.course_name,
                    "Student Name": r.student_name,
                    "Registration Number": r.institution_reg_num,
                    "Academic Year": r.academic_year,
                    "Masked APAAR ID": mask_apaar_id(r.apaar_id) if r.apaar_id else "UNASSIGNED",
                    "Verification Status": r.apaar_status,
                    "Verification Reference": r.apaar_verification_ref or "PENDING",
                    "Verified Date": r.apaar_verified_at.strftime("%Y-%m-%d") if r.apaar_verified_at else "—"
                })
            return results

        # 5. Duplicate Enrolment Report
        elif report_type == "duplicate_enrolments":
            query = db.query(DuplicateAlert)
            if institution_id:
                query = query.filter(
                    (DuplicateAlert.institution_a_id == institution_id) |
                    (DuplicateAlert.institution_b_id == institution_id)
                )

            alerts = query.all()
            results = []
            for a in alerts:
                inst_a = db.query(Institution).filter(Institution.id == a.institution_a_id).first()
                inst_b = db.query(Institution).filter(Institution.id == a.institution_b_id).first()
                results.append({
                    "Alert ID": a.id,
                    "Match Classification": a.match_category,
                    "Severity": a.severity,
                    "Institution 1": inst_a.name if inst_a else "N/A",
                    "Institution 2": inst_b.name if inst_b else "N/A",
                    "Masked APAAR ID": a.apaar_masked or "—",
                    "Reason": a.reason,
                    "Review Status": a.status,
                    "Resolution Notes": a.resolution_notes or "Under Investigation",
                    "Created Date": a.created_at.strftime("%Y-%m-%d %H:%M UTC") if a.created_at else "—"
                })
            return results

        # 6. Data Quality Issues Report
        elif report_type == "data_quality_issues":
            query = db.query(
                Institution.name.label("institution_name"),
                Course.course_name,
                Student.student_name,
                Student.institution_reg_num,
                Student.data_validation_status,
                Student.apaar_status
            ).join(
                Institution, Student.institution_id == Institution.id
            ).join(
                Course, Student.course_id == Course.id
            ).filter(
                Student.data_validation_status.in_(["WARNING", "ERROR"])
            )
            if institution_id:
                query = query.filter(Student.institution_id == institution_id)
            if academic_year:
                query = query.filter(Student.academic_year == academic_year)

            rows = query.all()
            results = []
            for r in rows:
                results.append({
                    "Institution Name": r.institution_name,
                    "Course Name": r.course_name,
                    "Student Name": r.student_name,
                    "Registration Number": r.institution_reg_num,
                    "Validation Status": r.data_validation_status,
                    "APAAR Status": r.apaar_status,
                    "Suggested Action": "Review missing or non-compliant fields via Institution Student Directory."
                })
            return results

        # 7. Pending Corrections Report
        elif report_type == "pending_corrections":
            query = db.query(CorrectionRequest, Institution, Student).join(
                Institution, CorrectionRequest.institution_id == Institution.id
            ).join(
                Student, CorrectionRequest.student_id == Student.id
            )
            if institution_id:
                query = query.filter(CorrectionRequest.institution_id == institution_id)

            rows = query.all()
            results = []
            for corr, inst, s in rows:
                results.append({
                    "Correction ID": corr.id,
                    "Institution Name": inst.name,
                    "Student Name": s.student_name,
                    "Registration Number": s.institution_reg_num,
                    "Field to Correct": corr.field_name,
                    "Current Value": corr.current_value or "None",
                    "Requested Value": corr.requested_value,
                    "Justification": corr.justification,
                    "Status": corr.status,
                    "Created Date": corr.created_at.strftime("%Y-%m-%d") if corr.created_at else "—"
                })
            return results

        # 8. Intake Change History Log (Rule 9)
        elif report_type == "intake_change_history":
            query = db.query(ApprovedIntakeRevision, Institution, Course).join(
                Institution, ApprovedIntakeRevision.institution_id == Institution.id
            ).join(
                Course, ApprovedIntakeRevision.course_id == Course.id
            )
            if institution_id:
                query = query.filter(ApprovedIntakeRevision.institution_id == institution_id)
            if academic_year:
                query = query.filter(ApprovedIntakeRevision.academic_year == academic_year)

            rows = query.all()
            results = []
            for rev, inst, c in rows:
                results.append({
                    "Revision ID": rev.id,
                    "Institution Name": inst.name,
                    "Course Name": c.course_name,
                    "Academic Year": rev.academic_year,
                    "Previous Sanctioned Intake": rev.previous_approved_intake,
                    "New Sanctioned Intake": rev.new_approved_intake,
                    "Intake Delta": rev.new_approved_intake - rev.previous_approved_intake,
                    "Approval Order Number": rev.approval_reference_number,
                    "Revision Reason": rev.revision_reason,
                    "Revised Timestamp": rev.created_at.strftime("%Y-%m-%d %H:%M UTC") if rev.created_at else "—"
                })
            return results

        return []

    @classmethod
    def export_csv(cls, rows: List[Dict[str, Any]]) -> str:
        if not rows:
            return "No data found matching the selected regulatory criteria."
        df = pd.DataFrame(rows)
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        return stream.getvalue()

    @classmethod
    def export_xlsx(cls, rows: List[Dict[str, Any]], sheet_name: str = "Report") -> bytes:
        if not rows:
            df = pd.DataFrame([{"Message": "No data found matching the selected regulatory criteria."}])
        else:
            df = pd.DataFrame(rows)
        stream = io.BytesIO()
        with pd.ExcelWriter(stream, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name=sheet_name[:31])
        stream.seek(0)
        return stream.getvalue()
