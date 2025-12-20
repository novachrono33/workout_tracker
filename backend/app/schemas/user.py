from pydantic import BaseModel, validator
from typing import Optional
import re

class UserBase(BaseModel):
    email: str
    username: str
    full_name: Optional[str] = None
    training_goal: Optional[str] = None

    @validator('email')
    def validate_email(cls, v):
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    training_goal: Optional[str] = None
    password: Optional[str] = None

    @validator('email')
    def validate_email(cls, v):
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v

class User(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None