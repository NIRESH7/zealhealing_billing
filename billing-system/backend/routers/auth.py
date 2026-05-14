from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from database import get_db
from models import UserCreate, UserDB, Token
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

router = APIRouter()

@router.post("/signup", response_model=UserDB)
async def create_user(user: UserCreate, db=Depends(get_db)):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    user_db = {
        "username": user.username,
        "hashed_password": hashed_password,
        "role": user.role
    }
    
    # insert
    new_user = await db.users.insert_one(user_db)
    created_user = await db.users.find_one({"_id": new_user.inserted_id})
    return created_user

from pydantic import BaseModel

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/login", response_model=Token)
async def login_for_access_token(user_data: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # return user without hashed_password
    return {
        "username": current_user["username"],
        "role": current_user["role"]
    }
