import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, 
    Text, Float, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class UserRole(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_mfa_enabled = Column(Boolean, default=False)
    
    # Optional institution membership for institution-level users
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    institution = relationship("Institution", back_populates="users")
    roles = relationship("UserRoleAssignment", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="roles")
    role = relationship("UserRole")

    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. 1-1002345
    name = Column(String(255), nullable=False)
    aicte_approval_ref = Column(String(100), nullable=False)
    institution_type = Column(String(50), nullable=False) # e.g. Govt, Govt-Aided, Private, Autonomous
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    status = Column(String(30), default="APPROVED") # APPROVED, PENDING, UNDER_REVIEW
    is_simulated = Column(Boolean, default=True) # Tagged for demonstration
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    users = relationship("User", back_populates="institution")
    departments = relationship("Department", back_populates="institution", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="institution", cascade="all, delete-orphan")
    approved_intakes = relationship("ApprovedIntake", back_populates="institution", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="institution")
    import_batches = relationship("ImportBatch", back_populates="institution")

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False) # e.g. Computer Science and Engineering
    code = Column(String(30), nullable=False) # e.g. CSE

    institution = relationship("Institution", back_populates="departments")
    courses = relationship("Course", back_populates="department")

    __table_args__ = (
        UniqueConstraint("institution_id", "code", name="uq_institution_dept_code"),
    )

class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    course_name = Column(String(200), nullable=False) # e.g. B.Tech Computer Science & Engineering
    course_code = Column(String(50), nullable=False) # e.g. BT-CSE
    degree_level = Column(String(50), nullable=False) # UG, PG, Diploma
    duration_years = Column(Integer, default=4)

    institution = relationship("Institution", back_populates="courses")
    department = relationship("Department", back_populates="courses")
    approved_intakes = relationship("ApprovedIntake", back_populates="course")
    students = relationship("Student", back_populates="course")

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    year_code = Column(String(20), unique=True, nullable=False) # e.g. 2024-2025
    is_current = Column(Boolean, default=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

class ApprovedIntake(Base):
    __tablename__ = "approved_intakes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20), nullable=False) # e.g. 2024-2025
    approved_intake = Column(Integer, nullable=False, default=0)
    supernumerary_quota = Column(Integer, nullable=False, default=0) # EWS, TFW, J&K, PMSSS, etc.
    actual_enrolment = Column(Integer, nullable=False, default=0)
    supernumerary_enrolled = Column(Integer, nullable=False, default=0)
    approval_order_ref = Column(String(100), nullable=True) # AICTE Approval Order Reference
    effective_date = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    institution = relationship("Institution", back_populates="approved_intakes")
    course = relationship("Course", back_populates="approved_intakes")
    revisions = relationship("ApprovedIntakeRevision", back_populates="intake", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("institution_id", "course_id", "academic_year", name="uq_intake_inst_course_year"),
        Index("idx_intake_year_inst", "academic_year", "institution_id"),
    )

class ApprovedIntakeRevision(Base):
    """
    Historical log of approved intake changes.
    Enforces Rule 9: Do not overwrite historical approved-intake records without preserving change history.
    """
    __tablename__ = "approved_intake_revisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    approved_intake_id = Column(String(36), ForeignKey("approved_intakes.id", ondelete="CASCADE"), nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    previous_approved_intake = Column(Integer, nullable=False)
    new_approved_intake = Column(Integer, nullable=False)
    previous_supernumerary = Column(Integer, nullable=False, default=0)
    new_supernumerary = Column(Integer, nullable=False, default=0)
    approval_reference_number = Column(String(100), nullable=False)
    revision_reason = Column(Text, nullable=False)
    revised_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    intake = relationship("ApprovedIntake", back_populates="revisions")
    revised_by = relationship("User")


class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Core Student Identifiers
    student_name = Column(String(200), nullable=False)
    institution_reg_num = Column(String(100), nullable=False, index=True) # Roll / Reg No
    apaar_id = Column(String(50), nullable=True, index=True) # Masked in logs & views
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)

    # Academic & Admission Context
    academic_year = Column(String(20), nullable=False, index=True)
    admission_year = Column(Integer, nullable=False)
    admission_date = Column(DateTime, nullable=True)
    admission_status = Column(String(50), default="ACTIVE") # ACTIVE, COMPLETED, TRANSFERRED, WITHDRAWN
    admission_category = Column(String(50), default="GENERAL") # GENERAL, SC, ST, OBC, EWS, TFW
    is_supernumerary = Column(Boolean, default=False)
    supernumerary_category = Column(String(50), nullable=True) # TFW, PMSSS, J&K, SPORTS
    is_nri = Column(Boolean, default=False)
    is_foreign_national = Column(Boolean, default=False)

    # Verification & Integrity Status
    apaar_status = Column(String(50), default="NOT_CHECKED") # NOT_CHECKED, FORMAT_VALID, VERIFIED, INVALID, PENDING, SERVICE_UNAVAILABLE, MANUAL_REVIEW_REQUIRED
    apaar_verified_at = Column(DateTime, nullable=True)
    apaar_verification_ref = Column(String(100), nullable=True)
    data_validation_status = Column(String(50), default="VALID") # VALID, WARNING, ERROR, UNDER_REVIEW

    # Source batch tracking
    import_batch_id = Column(String(36), ForeignKey("import_batches.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    institution = relationship("Institution", back_populates="students")
    course = relationship("Course", back_populates="students")
    import_batch = relationship("ImportBatch", back_populates="students")
    verification_requests = relationship("VerificationRequest", back_populates="student")

    __table_args__ = (
        UniqueConstraint("institution_id", "institution_reg_num", name="uq_inst_student_reg"),
        Index("idx_student_apaar", "apaar_id"),
        Index("idx_student_inst_year", "institution_id", "academic_year"),
    )

class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False) # CSV, XLSX
    file_size_bytes = Column(Integer, nullable=False)
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    warning_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    skipped_rows = Column(Integer, default=0)
    status = Column(String(50), default="PENDING") # PENDING, VALIDATING, COMPLETED, FAILED, PARTIALLY_IMPORTED
    summary_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    institution = relationship("Institution", back_populates="import_batches")
    students = relationship("Student", back_populates="import_batch")
    errors = relationship("ImportBatchError", back_populates="import_batch", cascade="all, delete-orphan")

class ImportBatchError(Base):
    __tablename__ = "import_batch_errors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False)
    row_number = Column(Integer, nullable=False)
    field_name = Column(String(100), nullable=True)
    error_level = Column(String(20), default="ERROR") # ERROR, WARNING
    error_category = Column(String(100), nullable=False) # MISSING_FIELD, INVALID_FORMAT, DUPLICATE_ROW, INTAKE_EXCEEDED
    error_message = Column(Text, nullable=False)
    raw_data = Column(JSON, nullable=True)

    import_batch = relationship("ImportBatch", back_populates="errors")

class DuplicateAlert(Base):
    __tablename__ = "duplicate_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    matched_student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    match_category = Column(String(100), nullable=False) # EXACT_APAAR_CONFLICT, CROSS_INSTITUTION_ENROLMENT, SAME_INSTITUTION_REG_DUPLICATE
    severity = Column(String(30), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    reason = Column(Text, nullable=False)
    apaar_masked = Column(String(50), nullable=True)
    institution_a_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    institution_b_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    status = Column(String(50), default="NEW") # NEW, UNDER_REVIEW, CONFIRMED_DUPLICATE, NOT_A_DUPLICATE, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    assigned_reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    resolved_at = Column(DateTime, nullable=True)

class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=True)
    academic_year = Column(String(20), nullable=False)
    alert_type = Column(String(100), nullable=False) # ENROLMENT_SURGE, INTAKE_MISMATCH, HIGH_INVALID_RATE, HISTORICAL_DEVIATION
    score = Column(Float, default=0.0)
    factors_json = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=False)
    status = Column(String(50), default="ACTIVE") # ACTIVE, INVESTIGATING, DISMISSED, CONFIRMED
    feedback = Column(String(50), nullable=True) # USEFUL, FALSE_POSITIVE
    created_at = Column(DateTime, default=get_utc_now)

class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    verification_code = Column(String(64), unique=True, nullable=False, index=True) # cryptographically secure token/hash
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    verifier_name = Column(String(150), nullable=True)
    verifier_organization = Column(String(200), nullable=True)
    purpose = Column(String(255), nullable=True) # Employment, Higher Ed, Visa
    status = Column(String(50), default="VERIFIED") # VERIFIED, NOT_VERIFIED, EXPIRED, REVOKED, REVIEW_REQUIRED
    qr_code_image_path = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(Text, nullable=True)
    revoked_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    student = relationship("Student", back_populates="verification_requests")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False, index=True) # LOGIN, UPLOAD_STUDENT_BATCH, INTAKE_MODIFIED, DUPLICATE_RESOLVED, REPORT_EXPORT
    resource_type = Column(String(50), nullable=False) # USER, STUDENT, INTAKE, BATCH, VERIFICATION
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True)

    user = relationship("User", back_populates="audit_logs")

class ValidationRuleConfig(Base):
    """
    Configurable deterministic validation rules with version history.
    Addresses Innovation 3 requirement: 'Keep rules configurable by authorized administrators and maintain a version history.'
    """
    __tablename__ = "validation_rule_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rule_id = Column(String(50), unique=True, nullable=False, index=True) # e.g. VAL-REQ-001
    rule_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # MANDATORY_FIELDS, FORMAT, CAPACITY, DUPLICATE, INTEGRITY
    severity = Column(String(30), nullable=False, default="ERROR") # INFO, WARNING, ERROR, CRITICAL
    description = Column(Text, nullable=False)
    rule_version = Column(String(20), default="v1.0")
    is_active = Column(Boolean, default=True)
    parameters_json = Column(JSON, nullable=True)
    suggested_action_template = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

class ValidationResult(Base):
    """
    Detailed explainable validation outputs for records/batches.
    Contains: Rule ID, version, affected record, severity, input values, result, human explanation, corrective action, timestamp.
    """
    __tablename__ = "validation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rule_id = Column(String(50), nullable=False, index=True)
    rule_version = Column(String(20), nullable=False)
    affected_record_reference = Column(String(200), nullable=False)
    severity = Column(String(30), nullable=False) # INFO, WARNING, ERROR, CRITICAL
    input_values_json = Column(JSON, nullable=True)
    result = Column(String(20), nullable=False) # PASS, FAIL, FLAG
    human_explanation = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    batch_id = Column(String(36), ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True)

class CorrectionRequest(Base):
    """
    Institutional workflow for requesting correction of student records.
    Addresses Section 15 and Innovation 7.
    """
    __tablename__ = "correction_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    current_value = Column(Text, nullable=True)
    requested_value = Column(Text, nullable=False)
    justification = Column(Text, nullable=False)
    supporting_doc_ref = Column(String(255), nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    resolved_at = Column(DateTime, nullable=True)

    institution = relationship("Institution")
    student = relationship("Student")
    reviewer = relationship("User")

class DataQualityMetric(Base):
    """
    Transparent Data-Quality Indicator components for institutional submissions.
    Addresses Innovation 7 requirement.
    """
    __tablename__ = "data_quality_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    reporting_period = Column(String(50), nullable=False)
    completeness_score = Column(Float, nullable=False, default=100.0) # Required-field completeness %
    validation_error_rate = Column(Float, nullable=False, default=0.0) # Validation error rate %
    duplicate_alert_rate = Column(Float, nullable=False, default=0.0) # Duplicate alert rate %
    correction_completion_rate = Column(Float, nullable=False, default=100.0) # Resolved corrections %
    verification_rate = Column(Float, nullable=False, default=0.0) # Verified APAAR %
    freshness_score = Column(Float, nullable=False, default=100.0) # Submission timeliness %
    overall_dqi_score = Column(Float, nullable=False, default=85.0) # Transparent weighted composite DQI
    formula_weights_json = Column(JSON, nullable=True)
    calculated_at = Column(DateTime, default=get_utc_now)

    institution = relationship("Institution")

class ApiClient(Base):
    """
    Authorized API Client credentials for external systems (AICTE Central, State DTEs, Inst ERPs).
    Addresses Section 15 requirement.
    """
    __tablename__ = "api_clients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    client_name = Column(String(150), nullable=False)
    api_key_prefix = Column(String(20), nullable=False, index=True)
    api_key_hash = Column(String(255), nullable=False)
    organization_type = Column(String(50), nullable=False) # AICTE_CENTRAL, STATE_DTE, INSTITUTION_ERP, BACKGROUND_VERIFIER
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    scopes_json = Column(JSON, nullable=True) # e.g. ["students:read", "intake:read"]
    rate_limit_per_min = Column(Integer, default=60)
    created_at = Column(DateTime, default=get_utc_now)

