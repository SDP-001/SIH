from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_user_roles, verify_institution_access
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse], include_in_schema=False)
@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    institution_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns audit trail logs for transparency and regulatory accountability.
    Strictly isolated per tenant permissions.
    """
    roles = get_user_roles(current_user, db)
    query = db.query(AuditLog, User.full_name.label("user_name")).outerjoin(
        User, AuditLog.user_id == User.id
    )

    if "SUPER_ADMIN" not in roles and "AICTE_ADMIN" not in roles:
        if current_user.institution_id:
            query = query.filter(AuditLog.institution_id == current_user.institution_id)
        else:
            return []
    elif institution_id:
        query = query.filter(AuditLog.institution_id == institution_id)

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    rows = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    output = []
    for log, u_name in rows:
        output.append(AuditLogResponse(
            id=log.id,
            user_name=u_name or "System / Anonymous",
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            ip_address=log.ip_address,
            details=log.details,
            created_at=log.created_at
        ))
    return output
