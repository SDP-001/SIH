from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User Schemas ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    roles: List[str]
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    roles: List[str] = ["INSTITUTION_ADMIN"]
    institution_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    roles: List[str]
    institution_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Institution Schemas ---
class InstitutionBase(BaseModel):
    institution_code: str
    name: str
    aicte_approval_ref: str
    institution_type: str
    state: str
    district: str
    address: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    aicte_approval_ref: Optional[str] = None
    institution_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None

class InstitutionResponse(InstitutionBase):
    id: str
    status: str
    is_simulated: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Department & Course Schemas ---
class DepartmentCreate(BaseModel):
    name: str
    code: str

class DepartmentResponse(BaseModel):
    id: str
    institution_id: str
    name: str
    code: str

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    department_id: str
    course_name: str
    course_code: str
    degree_level: str
    duration_years: int = 4

class CourseResponse(BaseModel):
    id: str
    institution_id: str
    department_id: str
    course_name: str
    course_code: str
    degree_level: str
    duration_years: int

    class Config:
        from_attributes = True

# --- Approved Intake Schemas ---
class ApprovedIntakeCreate(BaseModel):
    course_id: str
    academic_year: str
    approved_intake: int = Field(ge=0)
    supernumerary_quota: int = Field(ge=0, default=0)
    approval_order_ref: Optional[str] = "AICTE-EOA-2024-25"
    revision_reason: Optional[str] = "Initial Sanction / Regular Intake Configuration"

class ApprovedIntakeResponse(BaseModel):
    id: str
    institution_id: str
    course_id: str
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    academic_year: str
    approved_intake: int
    supernumerary_quota: int
    actual_enrolment: int
    supernumerary_enrolled: int
    approval_order_ref: Optional[str] = None
    effective_date: datetime
    status_indicator: Optional[str] = None # BELOW_CAPACITY, NEAR_CAPACITY, AT_CAPACITY, EXCESS_ENROLMENT

    class Config:
        from_attributes = True

class ApprovedIntakeRevisionResponse(BaseModel):
    id: str
    approved_intake_id: str
    academic_year: str
    previous_approved_intake: int
    new_approved_intake: int
    previous_supernumerary: int
    new_supernumerary: int
    approval_reference_number: str
    revision_reason: str
    revised_by_user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Student Schemas ---
class StudentCreate(BaseModel):
    course_id: str
    student_name: str
    institution_reg_num: str
    apaar_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    academic_year: str
    admission_year: int
    admission_category: str = "GENERAL"
    is_supernumerary: bool = False
    supernumerary_category: Optional[str] = None
    is_nri: bool = False
    is_foreign_national: bool = False

class StudentUpdate(BaseModel):
    student_name: Optional[str] = None
    apaar_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    admission_status: Optional[str] = None
    is_supernumerary: Optional[bool] = None
    supernumerary_category: Optional[str] = None

class StudentResponse(BaseModel):
    id: str
    institution_id: str
    institution_name: Optional[str] = None
    course_id: str
    course_name: Optional[str] = None
    student_name: str
    institution_reg_num: str
    masked_apaar_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    academic_year: str
    admission_year: int
    admission_status: str
    admission_category: str
    is_supernumerary: bool
    supernumerary_category: Optional[str] = None
    apaar_status: str
    data_validation_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Import Schemas ---
class ImportBatchResponse(BaseModel):
    id: str
    institution_id: str
    file_name: str
    file_type: str
    total_rows: int
    valid_rows: int
    warning_rows: int
    error_rows: int
    imported_rows: int
    skipped_rows: int
    status: str
    summary_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ImportBatchErrorResponse(BaseModel):
    id: str
    batch_id: str
    row_number: int
    field_name: Optional[str] = None
    error_level: str
    error_category: str
    error_message: str

    class Config:
        from_attributes = True

# --- Duplicate Alert Schemas ---
class DuplicateAlertResponse(BaseModel):
    id: str
    student_id: Optional[str] = None
    matched_student_id: Optional[str] = None
    student_name: Optional[str] = None
    institution_a_name: Optional[str] = None
    institution_b_name: Optional[str] = None
    match_category: str
    severity: str
    reason: str
    apaar_masked: Optional[str] = None
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DuplicateResolveRequest(BaseModel):
    status: str # CONFIRMED_DUPLICATE, NOT_A_DUPLICATE, RESOLVED
    resolution_notes: str

# --- Verification Request Schemas ---
class VerificationGenerateRequest(BaseModel):
    student_id: str
    purpose: str = "ACADEMIC_CREDENTIAL_VERIFICATION"
    verifier_name: Optional[str] = None
    verifier_organization: Optional[str] = None

class VerificationPublicResponse(BaseModel):
    verification_code: str
    status: str # VERIFIED, NOT_VERIFIED, EXPIRED, REVOKED, REVIEW_REQUIRED
    student_name: str
    institution_name: str
    course_name: str
    institution_reg_num: str
    masked_apaar_id: Optional[str] = None
    academic_year: str
    admission_year: int
    admission_status: str
    is_supernumerary: bool
    verification_date: datetime
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    demo_mode: bool = True
    qr_code_base64: Optional[str] = None
    claim_details: Optional[Dict[str, str]] = None # Explicit tripartite distinction


# --- Anomaly Schemas ---
class AnomalyAlertResponse(BaseModel):
    id: str
    institution_id: str
    institution_name: Optional[str] = None
    course_name: Optional[str] = None
    academic_year: str
    alert_type: str
    score: float
    factors_json: Optional[Dict[str, Any]] = None
    explanation: str
    status: str
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AnomalyFeedbackRequest(BaseModel):
    feedback: str # USEFUL, FALSE_POSITIVE
    status: Optional[str] = "DISMISSED"

# --- Dashboard Schemas ---
class AICTEDashboardMetrics(BaseModel):
    total_institutions: int
    total_reported_students: int
    total_approved_intake: int
    institutions_with_excess_intake: int
    open_duplicate_alerts: int
    pending_apaar_verifications: int
    verified_apaar_count: int
    data_quality_issues: int
    enrolment_by_state: List[Dict[str, Any]]
    intake_vs_enrolment: List[Dict[str, Any]]
    top_courses_enrolment: List[Dict[str, Any]]
    recent_duplicate_alerts: List[DuplicateAlertResponse]
    demo_mode: bool = True

class InstitutionDashboardMetrics(BaseModel):
    institution_id: str
    institution_name: str
    total_students: int
    approved_intake: int
    actual_enrolment: int
    supernumerary_enrolled: int
    validated_records: int
    records_with_warnings: int
    records_with_errors: int
    pending_apaar_verification: int
    verified_apaar_count: int
    open_duplicate_alerts: int
    course_intake_breakdown: List[Dict[str, Any]]
    recent_batches: List[ImportBatchResponse]
    demo_mode: bool = True

# --- Innovation 3: Validation Rules & Results ---
class ValidationRuleConfigResponse(BaseModel):
    id: str
    rule_id: str
    rule_name: str
    category: str
    severity: str
    description: str
    rule_version: str
    is_active: bool
    parameters_json: Optional[Dict[str, Any]] = None
    suggested_action_template: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ValidationRuleConfigUpdate(BaseModel):
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    parameters_json: Optional[Dict[str, Any]] = None

class ValidationResultResponse(BaseModel):
    id: str
    rule_id: str
    rule_version: str
    affected_record_reference: str
    severity: str
    input_values_json: Optional[Dict[str, Any]] = None
    result: str
    human_explanation: str
    suggested_action: str
    institution_id: str
    student_id: Optional[str] = None
    batch_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Innovation 6: AICTE Officer Assistant ---
class OfficerAssistantQuery(BaseModel):
    question: str
    academic_year: Optional[str] = None
    institution_id: Optional[str] = None

class OfficerAssistantResponse(BaseModel):
    question: str
    structured_intent: str
    summary_answer: str
    metric_values: Dict[str, Any]
    filters_applied: Dict[str, Any]
    supporting_data: List[Dict[str, Any]]
    underlying_report_link: str
    explainability_notes: str
    generated_at: datetime

# --- Innovation 7: Data Quality Score ---
class DataQualityMetricResponse(BaseModel):
    id: str
    institution_id: str
    institution_name: Optional[str] = None
    academic_year: str
    reporting_period: str
    completeness_score: float
    validation_error_rate: float
    duplicate_alert_rate: float
    correction_completion_rate: float
    verification_rate: float
    freshness_score: float
    overall_dqi_score: float
    formula_weights_json: Optional[Dict[str, Any]] = None
    calculated_at: datetime

    class Config:
        from_attributes = True

# --- Correction Requests ---
class CorrectionRequestCreate(BaseModel):
    student_id: str
    field_name: str
    requested_value: str
    justification: str
    supporting_doc_ref: Optional[str] = None

class CorrectionRequestResolve(BaseModel):
    status: str # APPROVED, REJECTED
    review_notes: str

class CorrectionRequestResponse(BaseModel):
    id: str
    institution_id: str
    student_id: str
    student_name: Optional[str] = None
    institution_reg_num: Optional[str] = None
    field_name: str
    current_value: Optional[str] = None
    requested_value: str
    justification: str
    supporting_doc_ref: Optional[str] = None
    status: str
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Verification Revocation ---
class VerificationRevokeRequest(BaseModel):
    reason: str

# --- Audit Logs ---
class AuditLogResponse(BaseModel):
    id: str
    user_name: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

