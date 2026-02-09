from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    CUSTOMER = "customer"  # DB와 동일 (회원가입 기본값)
    ADMIN = "admin"
    SELLER = "seller"


# ========== Address ==========
class AddressBase(BaseModel):
    recipient_name: str = Field(..., max_length=100)
    phone: str = Field(..., max_length=20)
    zip_code: str = Field(..., max_length=10)
    address1: str = Field(..., max_length=255)
    address2: Optional[str] = Field(None, max_length=255)
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    recipient_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    zip_code: Optional[str] = Field(None, max_length=10)
    address1: Optional[str] = Field(None, max_length=255)
    address2: Optional[str] = Field(None, max_length=255)
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== User ==========
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    phone: Optional[str]
    role: Optional[str] = None  # DB: customer/admin/seller
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserWithAddresses(UserOut):
    addresses: List[AddressResponse] = []


# ========== Token ==========
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes


class TokenWithUser(Token):
    user: UserOut
