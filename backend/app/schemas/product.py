from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ProductImageOut(BaseModel):
    id: int
    product_id: int
    url: str
    is_main: bool = False
    sort_order: int = 0

    class Config:
        from_attributes = True


class ProductVariantOut(BaseModel):
    id: int
    sku: Optional[str] = None
    name: Optional[str] = None
    price_usd: Optional[float] = None
    price_krw: Optional[int] = None
    stock: int = 0

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    title: str
    title_ko: Optional[str] = None
    description: Optional[str] = None
    description_ko: Optional[str] = None
    price_original: Optional[int] = None
    price_krw: Optional[int] = None
    price_final: Optional[int] = None
    main_image: Optional[str] = None
    category: Optional[str] = None
    stock_status: str = "in_stock"


class ProductCreate(ProductBase):
    supplier_id: int
    external_id: Optional[str] = None


class ProductOut(ProductBase):
    id: int
    supplier_id: Optional[int] = None
    external_id: Optional[str] = None
    is_active: bool = True
    origin_url: Optional[str] = None
    shipping_days_min: int = 7
    shipping_days_max: int = 14
    stock: int = 0
    variants: List[ProductVariantOut] = []
    images: List[ProductImageOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListOut(BaseModel):
    items: List[ProductOut]
    total: int
    skip: int
    limit: int
