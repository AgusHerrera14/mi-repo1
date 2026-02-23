from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permisos de administrador requeridos")
    return current_user


def require_supervisor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "supervisor"):
        raise HTTPException(status_code=403, detail="Permisos de supervisor requeridos")
    return current_user


def require_operador(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "operador", "supervisor"):
        raise HTTPException(status_code=403, detail="Permisos de operador requeridos")
    return current_user
