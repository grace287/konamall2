from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ProductVariantOut(BaseModel):
    id: int
    sku: Optional[str]
    name: Optional[str]
    price_usd: Optional[float]
    price_krw: Optional[int]
    stock: int
    
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    title: str
    title_ko: Optional[str]
    description: Optional[str]
    description_ko: Optional[str]
    price_original_usd: Optional[float]
    price_krw: Optional[int]
    main_image: Optional[str]
    images: List[str] = []
    category: Optional[str]
    stock_status: str = "in_stock"


class ProductCreate(ProductBase):
    supplier_id: int
    external_id: Optional[str]


class ProductOut(ProductBase):
    id: int
    supplier_id: Optional[int]
    external_id: Optional[str]
    is_active: bool
    origin_url: Optional[str]
    shipping_days_min: int
    shipping_days_max: int
    variants: List[ProductVariantOut] = []
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ProductListOut(BaseModel):
    items: List[ProductOut]
    total: int
    skip: int
    limit: int
