from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

class Location(BaseModel):
    city: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    cep: Optional[str] = ""

class UserStats(BaseModel):
    games_played: int = 0
    games_won: int = 0
    games_lost: int = 0
    current_score: int = 1000

class UserProfile(BaseModel):
    name: str
    age: Optional[int] = None
    location: Optional[Location] = Location()
    avatar_url: Optional[str] = ""

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    profile: UserProfile
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    profile: Optional[UserProfile] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    is_admin: bool = False
    stats: UserStats = UserStats()
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(UserBase):
    id: str = Field(alias="_id")
    stats: UserStats
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True

class UserPublic(BaseModel):
    id: str
    username: str
    email: EmailStr
    profile: UserProfile
    stats: UserStats
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True



class UserWithGames(UserPublic):
    games: Optional[List[Dict[str, Any]]] = []

    class Config:
        allow_population_by_field_name = True
