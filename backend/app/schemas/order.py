from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


# ========== Cart ==========
class CartItemAdd(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int]
    quantity: int
    product_title: str = ""
    product_image: Optional[str] = None
    price_krw: int = 0
    line_total: int = 0

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse] = []
    subtotal: int = 0
    shipping_fee: int = 0
    total: int = 0

    class Config:
        from_attributes = True


# ========== Order Enums ==========
class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    KAKAO_PAY = "kakao_pay"
    NAVER_PAY = "naver_pay"


# ========== Order ==========
class OrderCreate(BaseModel):
    address_id: int
    payment_method: PaymentMethod = PaymentMethod.CARD
    note: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int]
    product_title: str
    variant_name: Optional[str]
    quantity: int
    unit_price: int
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    total_amount: int
    items_count: int = 0
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OrderDetailOut(OrderOut):
    items: List[OrderItemOut] = []
    subtotal_krw: int
    shipping_cost_krw: int
    tax_krw: int
    shipping_name: str
    shipping_phone: str
    shipping_zip_code: str
    shipping_address1: str
    shipping_address2: Optional[str]
    payment_method: Optional[str]
    paid_at: Optional[datetime]
    note: Optional[str]


class OrderListOut(BaseModel):
    items: List[OrderOut]
    total: int
    page: int = 1
    limit: int = 20


# ========== Shipment ==========
class ShipmentStatus(str, Enum):
    PENDING = "pending"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    EXCEPTION = "exception"


class ShipmentEventOut(BaseModel):
    status: str
    description: Optional[str]
    location: Optional[str]
    occurred_at: datetime

    class Config:
        from_attributes = True


class ShipmentOut(BaseModel):
    id: int
    tracking_number: Optional[str]
    courier: Optional[str]
    courier_url: Optional[str]
    status: ShipmentStatus
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    events: List[ShipmentEventOut] = []

    class Config:
        from_attributes = True
