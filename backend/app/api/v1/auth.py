from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token
from typing import List, Optional
from app.core.deps import get_current_user, get_user_roles, RoleChecker
from app.models.models import User, Institution, AuditLog, UserRole, UserRoleAssignment
from app.schemas.schemas import UserLogin, TokenResponse, UserResponse, UserCreate
from app.core.security import get_password_hash
from app.services.seed_service import seed_database

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact your administrator."
        )

    roles = get_user_roles(user, db)
    inst_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            inst_name = inst.name

    access_token = create_access_token(
        subject=user.id,
        roles=roles,
        institution_id=user.institution_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Log login event
    db.add(AuditLog(
        user_id=user.id,
        institution_id=user.institution_id,
        action="USER_LOGIN",
        resource_type="USER",
        resource_id=user.id,
        details={"email": user.email, "roles": roles}
    ))
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        roles=roles,
        institution_id=user.institution_id,
        institution_name=inst_name
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(current_user, db)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        roles=roles,
        institution_id=current_user.institution_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.get("/users")
def list_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List registered platform users with assigned roles and institution context.
    """
    query = db.query(User)
    
    # Institution Admins only see their own institution users
    caller_roles = get_user_roles(current_user, db)
    if "SUPER_ADMIN" not in caller_roles and "AICTE_ADMIN" not in caller_roles:
        if current_user.institution_id:
            query = query.filter(User.institution_id == current_user.institution_id)
        else:
            return []

    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )

    users = query.order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        u_roles = get_user_roles(u, db)
        if role and role not in u_roles:
            continue
        inst_name = u.institution.name if u.institution else None
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone_number": u.phone_number,
            "roles": u_roles,
            "institution_id": u.institution_id,
            "institution_name": inst_name,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_active": "Recently active" if u.is_active else "Deactivated"
        })
    return results

@router.post("/users")
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN", "INSTITUTION_ADMIN"]))
):
    """
    Create a new platform user with assigned role and credentials.
    """
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        institution_id=user_in.institution_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Assign roles
    for r_name in user_in.roles:
        role_record = db.query(UserRole).filter(UserRole.name == r_name).first()
        if not role_record:
            role_record = UserRole(name=r_name, description=f"{r_name} role")
            db.add(role_record)
            db.commit()
            db.refresh(role_record)
        db.add(UserRoleAssignment(user_id=new_user.id, role_id=role_record.id))
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=new_user.institution_id,
        action="USER_CREATED",
        resource_type="USER",
        resource_id=new_user.id,
        details={"created_email": new_user.email, "roles": user_in.roles}
    ))
    db.commit()

    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "roles": user_in.roles,
        "is_active": new_user.is_active
    }

@router.patch("/users/{user_id}/status")
def toggle_user_active_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "AICTE_ADMIN", "INSTITUTION_ADMIN"]))
):
    """
    Activate or deactivate user account with audit ledger record.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = not target.is_active
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        institution_id=target.institution_id,
        action="USER_STATUS_TOGGLED",
        resource_type="USER",
        resource_id=target.id,
        details={"email": target.email, "new_active_status": target.is_active}
    ))
    db.commit()

    return {"id": target.id, "email": target.email, "is_active": target.is_active}

@router.post("/seed-demo")
def trigger_seed_demo(db: Session = Depends(get_db)):
    """
    Seeds initial demonstration data for SIH hackathon.
    Creates demo institutions, users, intakes, and students.
    """
    result = seed_database(db)
    return result

