from typing import List
from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.security.auth import get_current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {self.allowed_roles}",
            )
        return current_user

# Common dependencies
require_admin = RoleChecker(["admin"])
require_editor = RoleChecker(["admin", "editor"])
require_viewer = RoleChecker(["admin", "editor", "viewer"])
