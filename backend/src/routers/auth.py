from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from ..core.database import AsyncSessionLocal
from sqlalchemy import text, select
from ..models.user import User
from ..core.auth import verify_password, create_access_token, Token, get_password_hash
from ..core.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    return email

@router.post("/register")
async def register(user: UserCreate):
    async with AsyncSessionLocal() as session:
        hashed = get_password_hash(user.password)
        db_user = User(email=user.email, hashed_password=hashed, full_name=user.full_name)
        session.add(db_user)
        await session.commit()
        return {"msg": "User created"}

@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == form.username))
        user = result.scalar_one_or_none()
        if not user or not verify_password(form.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token({"sub": user.email})
        return {"access_token": token, "token_type": "bearer"}