from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SupplierType(str, Enum):
    TEMU = "temu"
    ALIEXPRESS = "aliexpress"
    AMAZON = "amazon"
    LOCAL = "local"


class SupplierBase(BaseModel):
    name: str
    supplier_type: SupplierType
    base_url: Optional[str] = None
    is_active: bool = True
    config: Dict[str, Any] = {}


class SupplierCreate(SupplierBase):
    api_key: Optional[str] = None
    api_secret: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    is_active: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    supplier_type: SupplierType
    is_active: bool
    products_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class SupplierDetailResponse(SupplierResponse):
    base_url: Optional[str]
    config: Dict[str, Any]


# ========== Sync Task ==========
class SyncTaskResponse(BaseModel):
    message: str
    task_id: Optional[str] = None
    supplier_id: int
