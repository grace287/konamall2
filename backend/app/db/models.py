"""
SQLAlchemy models - KonaMall
마이그레이션 001_initial_schema와 동기화. ProductVariant/cart_items.variant_id 등은 002에서 추가.
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum
from typing import Optional, List, Any

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Numeric, DateTime, ForeignKey,
    UniqueConstraint, Index, JSON, Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


# --- Enums (DB enum 이름과 일치) ---
class UserRole(str, PyEnum):
    CUSTOMER = "customer"
    SELLER = "seller"
    ADMIN = "admin"


class OrderStatus(str, PyEnum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class ExternalOrderStatus(str, PyEnum):
    PENDING = "pending"
    ORDERED = "ordered"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    FAILED = "failed"


class ShipmentStatus(str, PyEnum):
    PENDING = "pending"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    EXCEPTION = "exception"


class PaymentStatus(str, PyEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


# --- Suppliers ---
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    connector_type = Column(String(50), nullable=False)  # temu, aliexpress 등
    api_key = Column(Text, nullable=True)
    api_secret = Column(Text, nullable=True)
    config = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    products = relationship("Product", back_populates="supplier")
    external_orders = relationship("ExternalOrder", back_populates="supplier")

    @property
    def supplier_type(self):
        """connector_type을 enum처럼 사용하기 위한 호환 속성."""
        return type("SupplierType", (), {"value": self.connector_type})()


# --- Users ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(
        SQLEnum(UserRole, values_callable=lambda obj: [e.value for e in obj]),
        default=UserRole.CUSTOMER,
        index=True,
    )
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    carts = relationship("Cart", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")


# --- Addresses ---
class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(50), nullable=True)
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    postal_code = Column(String(20), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(50), nullable=False, server_default="KR")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="addresses")


# --- Products ---
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    external_id = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True)
    name = Column(String(500), nullable=False)
    name_ko = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    description_ko = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    brand = Column(String(100), nullable=True)
    original_price = Column(Numeric(12, 2), nullable=False)
    selling_price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="KRW")
    stock = Column(Integer, default=0)
    weight = Column(Numeric(8, 2), nullable=True)
    external_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    supplier = relationship("Supplier", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

    __table_args__ = (UniqueConstraint("supplier_id", "external_id", name="uq_supplier_external_id"),)
    Index("ix_products_external_id", "external_id")

    @property
    def title(self) -> str:
        return self.name

    @property
    def title_ko(self) -> Optional[str]:
        return self.name_ko

    @property
    def price_final(self) -> int:
        """판매가(KRW). 정수 원화."""
        return int(self.selling_price) if self.selling_price else 0

    @property
    def price_krw(self) -> int:
        """API/스키마 호환용."""
        return self.price_final

    @property
    def price_original(self) -> int:
        """정가(KRW). 정수 원화."""
        return int(self.original_price) if self.original_price else 0


# --- Product images (001: is_primary) ---
class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="images")

    @property
    def is_main(self) -> bool:
        return bool(self.is_primary)


# --- Product variants (002 마이그레이션에서 테이블 생성) ---
class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    external_variant_id = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    sku = Column(String(100), nullable=True)
    price_krw = Column(Numeric(12, 0), nullable=True)
    stock = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="variants")


Product.variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan", lazy="dynamic")


# --- Carts ---
class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="carts")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


# --- Cart items (001: variant_info만; 002에서 variant_id 컬럼 추가 권장) ---
class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    variant_info = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True, index=True)
    variant = relationship("ProductVariant", foreign_keys=[variant_id])

    __table_args__ = (UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),)


# --- Orders ---
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False, index=True)
    order_number = Column(String(50), nullable=False, unique=True, index=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, index=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    shipping_fee = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    currency = Column(String(3), default="KRW")
    shipping_address_id = Column(Integer, ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)
    recipient_name = Column(String(100), nullable=True)
    recipient_phone = Column(String(20), nullable=True)
    recipient_address = Column(Text, nullable=True)
    recipient_postal_code = Column(String(20), nullable=True)
    payment_method = Column(String(50), nullable=True)
    payment_id = Column(String(255), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    external_orders = relationship("ExternalOrder", back_populates="order")
    shipments = relationship("Shipment", back_populates="order")

    # 코드 호환용 별칭 (001 스키마: recipient_* 단일 주소)
    @property
    def shipping_name(self) -> Optional[str]:
        return self.recipient_name

    @property
    def shipping_phone(self) -> Optional[str]:
        return self.recipient_phone

    @property
    def shipping_zip_code(self) -> Optional[str]:
        return self.recipient_postal_code

    @property
    def shipping_address1(self) -> Optional[str]:
        return self.recipient_address

    @property
    def shipping_address2(self) -> Optional[str]:
        return None


# --- Order items ---
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(500), nullable=False)
    product_sku = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    variant_info = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    variant = relationship("ProductVariant", foreign_keys=[variant_id])
    external_orders = relationship("ExternalOrder", back_populates="order_item")


# --- External orders (001: order_item_id; 002에서 order_id 추가) ---
class ExternalOrder(Base):
    __tablename__ = "external_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    external_order_id = Column(String(255), nullable=True, index=True)
    status = Column(String(50), default="pending")
    raw_response = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    attempts = Column(Integer, default=0)
    placed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order_item = relationship("OrderItem", back_populates="external_orders")
    order = relationship("Order", back_populates="external_orders")
    supplier = relationship("Supplier", back_populates="external_orders")
    shipments = relationship("Shipment", back_populates="external_order")


# --- Shipments ---
class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    external_order_id = Column(Integer, ForeignKey("external_orders.id", ondelete="SET NULL"), nullable=True)
    tracking_number = Column(String(100), nullable=True, index=True)
    courier = Column(String(100), nullable=True)
    courier_url = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order = relationship("Order", back_populates="shipments")
    external_order = relationship("ExternalOrder", back_populates="shipments")
    events = relationship("ShipmentEvent", back_populates="shipment", cascade="all, delete-orphan")


# --- Shipment events (001: event_time) ---
class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    event_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shipment = relationship("Shipment", back_populates="events")

    @property
    def occurred_at(self) -> Optional[datetime]:
        return self.event_time
