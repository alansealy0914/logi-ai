from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(credentials = Depends(security)):
    token = credentials.credentials if hasattr(credentials, 'credentials') else str(credentials)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return TokenData(email=email)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")