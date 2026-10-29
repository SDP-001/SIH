from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker, get_user_roles, verify_institution_access
from app.models.models import (
    DuplicateAlert, AnomalyAlert, Student, Institution, User, AuditLog,
    ValidationRuleConfig, ValidationResult
)
from app.schemas.schemas import (
    DuplicateAlertResponse, DuplicateResolveRequest,
    AnomalyAlertResponse, AnomalyFeedbackRequest,
    ValidationRuleConfigResponse, ValidationRuleConfigUpdate,
    ValidationResultResponse
)
from app.services.validation_engine import ExplainableValidationEngine, init_default_validation_rules
from app.services.anomaly_detection_service import AIAnomalyDetectionService

router = APIRouter(prefix="/validation", tags=["Validation & Alerts"])

# --- Innovation 3: Configurable Rules & Results ---
@router.get("/rules", response_model=List[ValidationRuleConfigResponse])
def get_validation_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns configurable validation rules. Initializes defaults if table is empty.
    """
    rules = db.query(ValidationRuleConfig).order_by(ValidationRuleConfig.rule_id.asc()).all()
    if not rules:
        init_default_validation_rules(db)
        rules = db.query(ValidationRuleConfig).order_by(ValidationRuleConfig.rule_id.asc()).all()
    return rules

@router.put("/rules/{rule_id}", response_model=ValidationRuleConfigResponse)
def update_validation_rule(
    rule_id: str,
    update_in: ValidationRuleConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN"]))
):
    """
    Allows authorized administrators to configure validation rules (severity, thresholds, active state).
    """
    rule = db.query(ValidationRuleConfig).filter(ValidationRuleConfig.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Validation rule not found")

    if update_in.severity is not None:
        rule.severity = update_in.severity
    if update_in.is_active is not None:
        rule.is_active = update_in.is_active
    if update_in.parameters_json is not None:
        rule.parameters_json = update_in.parameters_json

    rule.updated_at = datetime.now(timezone.utc)
    db.add(AuditLog(
        user_id=current_user.id,
        action="VALIDATION_RULE_UPDATED",
        resource_type="VALIDATION_RULE",
        resource_id=rule.rule_id,
        details={"severity": rule.severity, "is_active": rule.is_active}
    ))
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/results", response_model=List[ValidationResultResponse])
def get_validation_results(
    institution_id: Optional[str] = None,
    rule_id: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns explainable validation engine results with Rule ID, version, severity, and action.
    """
    roles = get_user_roles(current_user, db)
    query = db.query(ValidationResult)

    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(ValidationResult.institution_id == current_user.institution_id)
        else:
            return []
    elif institution_id:
        query = query.filter(ValidationResult.institution_id == institution_id)

    if rule_id:
        query = query.filter(ValidationResult.rule_id == rule_id)
    if severity:
        query = query.filter(ValidationResult.severity == severity)

    return query.order_by(ValidationResult.created_at.desc()).limit(limit).all()

# --- Innovation 1: Duplicate Alerts ---
@router.get("/duplicates", response_model=List[DuplicateAlertResponse])
def get_duplicate_alerts(
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    query = db.query(DuplicateAlert)

    # Filter by user permissions
    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(
                (DuplicateAlert.institution_a_id == current_user.institution_id) |
                (DuplicateAlert.institution_b_id == current_user.institution_id)
            )
        else:
            return []

    if status_filter:
        query = query.filter(DuplicateAlert.status == status_filter)
    if severity:
        query = query.filter(DuplicateAlert.severity == severity)

    alerts = query.order_by(DuplicateAlert.created_at.desc()).all()
    output = []
    for a in alerts:
        inst_a = db.query(Institution).filter(Institution.id == a.institution_a_id).first() if a.institution_a_id else None
        inst_b = db.query(Institution).filter(Institution.id == a.institution_b_id).first() if a.institution_b_id else None
        s = db.query(Student).filter(Student.id == a.student_id).first() if a.student_id else None

        output.append(DuplicateAlertResponse(
            id=a.id,
            student_id=a.student_id,
            matched_student_id=a.matched_student_id,
            student_name=s.student_name if s else None,
            institution_a_name=inst_a.name if inst_a else None,
            institution_b_name=inst_b.name if inst_b else None,
            match_category=a.match_category,
            severity=a.severity,
            reason=a.reason,
            apaar_masked=a.apaar_masked,
            status=a.status,
            resolution_notes=a.resolution_notes,
            created_at=a.created_at
        ))
    return output

@router.post("/duplicates/{alert_id}/resolve", response_model=DuplicateAlertResponse)
def resolve_duplicate_alert(
    alert_id: str,
    resolve_data: DuplicateResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN", "INSTITUTION_ADMIN"]))
):
    alert = db.query(DuplicateAlert).filter(DuplicateAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Duplicate alert not found")

    alert.status = resolve_data.status
    alert.resolution_notes = resolve_data.resolution_notes
    alert.resolved_at = datetime.now(timezone.utc)
    alert.assigned_reviewer_id = current_user.id

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=alert.institution_a_id,
        action="DUPLICATE_ALERT_RESOLVED",
        resource_type="DUPLICATE_ALERT",
        resource_id=alert.id,
        details={"status": resolve_data.status, "notes": resolve_data.resolution_notes}
    ))
    db.commit()
    db.refresh(alert)

    inst_a = db.query(Institution).filter(Institution.id == alert.institution_a_id).first() if alert.institution_a_id else None
    inst_b = db.query(Institution).filter(Institution.id == alert.institution_b_id).first() if alert.institution_b_id else None
    s = db.query(Student).filter(Student.id == alert.student_id).first() if alert.student_id else None

    return DuplicateAlertResponse(
        id=alert.id,
        student_id=alert.student_id,
        matched_student_id=alert.matched_student_id,
        student_name=s.student_name if s else None,
        institution_a_name=inst_a.name if inst_a else None,
        institution_b_name=inst_b.name if inst_b else None,
        match_category=alert.match_category,
        severity=alert.severity,
        reason=alert.reason,
        apaar_masked=alert.apaar_masked,
        status=alert.status,
        resolution_notes=alert.resolution_notes,
        created_at=alert.created_at
    )

# --- Innovation 4: Anomaly Alerts ---
@router.get("/anomalies", response_model=List[AnomalyAlertResponse])
def get_anomaly_alerts(
    institution_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_user_roles(current_user, db)
    query = db.query(AnomalyAlert)

    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(AnomalyAlert.institution_id == current_user.institution_id)
        else:
            return []
    elif institution_id:
        query = query.filter(AnomalyAlert.institution_id == institution_id)

    alerts = query.order_by(AnomalyAlert.created_at.desc()).all()
    output = []
    for a in alerts:
        inst = db.query(Institution).filter(Institution.id == a.institution_id).first()
        course = db.query(Course).filter(Course.id == a.course_id).first() if a.course_id else None
        output.append(AnomalyAlertResponse(
            id=a.id,
            institution_id=a.institution_id,
            institution_name=inst.name if inst else None,
            course_name=course.course_name if course else None,
            academic_year=a.academic_year,
            alert_type=a.alert_type,
            score=a.score,
            factors_json=a.factors_json,
            explanation=a.explanation,
            status=a.status,
            feedback=a.feedback,
            created_at=a.created_at
        ))
    return output

@router.post("/anomalies/scan")
def trigger_anomaly_scan(
    academic_year: str = Query("2024-2025"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN"]))
):
    """
    Triggers AI-assisted anomaly detection scan across institutions.
    """
    new_alerts = AIAnomalyDetectionService.scan_institutional_anomalies(
        db=db,
        academic_year=academic_year
    )
    return {"status": "SUCCESS", "message": f"Scan completed. Flagged {len(new_alerts)} new anomaly patterns."}

@router.post("/anomalies/{alert_id}/feedback")
def submit_anomaly_feedback(
    alert_id: str,
    feedback_in: AnomalyFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(AnomalyAlert).filter(AnomalyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Anomaly alert not found")

    alert.feedback = feedback_in.feedback
    if feedback_in.status:
        alert.status = feedback_in.status

    db.add(AuditLog(
        user_id=current_user.id,
        action="ANOMALY_FEEDBACK_SUBMITTED",
        resource_type="ANOMALY_ALERT",
        resource_id=alert.id,
        details={"feedback": feedback_in.feedback, "status": alert.status}
    ))
    db.commit()
    return {"status": "SUCCESS", "message": "Feedback submitted successfully."}

