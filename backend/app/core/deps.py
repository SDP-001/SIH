from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.models import User, UserRoleAssignment, UserRole

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate user credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session invalidated. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )
    return user

def get_user_roles(user: User, db: Session) -> List[str]:
    assignments = db.query(UserRoleAssignment).filter(UserRoleAssignment.user_id == user.id).all()
    role_ids = [a.role_id for a in assignments]
    roles = db.query(UserRole).filter(UserRole.id.in_(role_ids)).all()
    return [r.name for r in roles]

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        user_roles = get_user_roles(current_user, db)
        # SUPER_ADMIN has access to everything
        if "SUPER_ADMIN" in user_roles:
            return current_user
        
        has_role = any(role in self.allowed_roles for role in user_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(self.allowed_roles)}"
            )
        return current_user

def verify_institution_access(
    institution_id: str,
    current_user: User,
    db: Session
) -> None:
    """
    Prevents cross-institution data access.
    AICTE_ADMIN and SUPER_ADMIN have cross-institution read/write access.
    Institution users can ONLY access their own institution records.
    """
    user_roles = get_user_roles(current_user, db)
    if "SUPER_ADMIN" in user_roles or "AICTE_ADMIN" in user_roles:
        return
    
    if current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to access records for another institution."
        )
