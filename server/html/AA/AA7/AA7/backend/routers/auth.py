from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from typing import Optional

from models.user import UserCreate, UserInDB, User, UserProfile, Location, UserPublic
from database import get_collection

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserPublic

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    name: str
    age: Optional[int] = None
    city: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    users_collection = await get_collection("users")
    # Convert string to ObjectId for MongoDB query
    from bson import ObjectId
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    # Convert to UserPublic for safe return
    user['id'] = str(user['_id'])
    del user['_id']
    del user['password_hash']  # Remove sensitive data
    
    return UserPublic(**user)

@router.post("/register", response_model=Token)
async def register(request: RegisterRequest):
    users_collection = await get_collection("users")
    
    # Check if user already exists
    existing_user = await users_collection.find_one({
        "$or": [
            {"email": request.email},
            {"username": request.username}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user
    location = Location(city=request.city, state=request.state, country=request.country)
    profile = UserProfile(name=request.name, age=request.age, location=location)
    
    user_data = UserCreate(
        username=request.username,
        email=request.email,
        password=request.password,
        profile=profile
    )
    
    user_in_db = UserInDB(
        **user_data.dict(exclude={"password"}),
        password_hash=get_password_hash(user_data.password)
    )
    
    result = await users_collection.insert_one(user_in_db.dict(by_alias=True))
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(result.inserted_id)}, expires_delta=access_token_expires
    )
    
    # Get created user
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    created_user['id'] = str(created_user['_id'])
    del created_user['_id']
    del created_user['password_hash']  # Remove sensitive data
    user = UserPublic(**created_user)
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    users_collection = await get_collection("users")
    
    # Find user by email
    user_doc = await users_collection.find_one({"email": request.email})
    
    if not user_doc or not verify_password(request.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await users_collection.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_doc["_id"])}, expires_delta=access_token_expires
    )
    
    user_doc['id'] = str(user_doc['_id'])
    del user_doc['_id']
    del user_doc['password_hash']  # Remove sensitive data
    user = UserPublic(**user_doc)
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.get("/me", response_model=UserPublic)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    # Convert User to UserPublic (remove sensitive data)
    user_dict = current_user.dict()
    return UserPublic(**user_dict)
