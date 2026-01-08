"""Utilities for handling user roles safely across transition from Role FK to string roles."""
from typing import Optional, Iterable


def _role_name_from(role) -> Optional[str]:
    """Return normalized role name (uppercased) from various role representations.

    Supports:
    - str (e.g., 'ADMIN')
    - object with attribute "name" (legacy Role model)
    - dict-like with key 'name'
    """
    if role is None:
        return None
    if isinstance(role, str):
        return role.upper()
    # Legacy Role object with .name
    if hasattr(role, 'name'):
        try:
            return getattr(role, 'name') and getattr(role, 'name').upper()
        except Exception:
            return None
    # dict-like
    try:
        name = role.get('name')
        return name.upper() if name else None
    except Exception:
        return None


def user_has_role(user, name: str) -> bool:
    """Return True if user's role equals `name` (case-insensitive).

    Usage:
        user_has_role(request.user, 'ADMIN')
    """
    rn = _role_name_from(getattr(user, 'role', None))
    if rn is None:
        return False
    return rn == name.upper()


def user_role_in(user, names: Iterable[str]) -> bool:
    """Return True if user's role is in the provided iterable of names."""
    rn = _role_name_from(getattr(user, 'role', None))
    if rn is None:
        return False
    upper = {n.upper() for n in names}
    return rn in upper
