from sqlalchemy import Column, Integer, String, Text, Boolean, Float, BigInteger, DateTime, ForeignKey, JSON, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


# ========== Enums ==========
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SELLER = "seller"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class ExternalOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ORDERED = "ordered"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ShipmentStatus(str, enum.Enum):
    PENDING = "pending"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    EXCEPTION = "exception"


class SupplierType(str, enum.Enum):
    TEMU = "temu"
    ALIEXPRESS = "aliexpress"
    AMAZON = "amazon"
    LOCAL = "local"


# ========== User ==========
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="user")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    cart = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    zip_code = Column(String(10), nullable=False)
    address1 = Column(String(255), nullable=False)
    address2 = Column(String(255))
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="addresses")


# ========== Cart ==========
class Cart(Base):
    __tablename__ = "carts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")


# ========== Supplier ==========
class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    supplier_type = Column(Enum(SupplierType), nullable=False)
    base_url = Column(String(500))
    api_key = Column(String(500))  # Encrypted
    api_secret = Column(String(500))  # Encrypted
    is_active = Column(Boolean, default=True)
    config = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    products = relationship("Product", back_populates="supplier")
    external_orders = relationship("ExternalOrder", back_populates="supplier")


# ========== Product ==========
class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index('idx_products_supplier', 'supplier_id'),
        Index('idx_products_external', 'external_id'),
        Index('idx_products_price', 'price_final'),
        Index('idx_products_active', 'is_active', postgresql_where='is_active = true'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(String(100), index=True, nullable=False)
    
    title = Column(String(500), nullable=False)
    title_ko = Column(String(500))
    description = Column(Text)
    description_ko = Column(Text)
    
    price_original = Column(Float, nullable=False)  # USD
    price_final = Column(BigInteger, nullable=False)  # KRW (with margin)
    currency = Column(String(3), default="USD")
    
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    category = Column(String(100))
    tags = Column(JSON, default=[])
    
    origin_url = Column(String(1000))
    shipping_days_min = Column(Integer, default=7)
    shipping_days_max = Column(Integer, default=21)
    
    last_synced_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    external_variant_id = Column(String(100))
    
    sku = Column(String(100))
    name = Column(String(200))
    price_usd = Column(Float)
    price_krw = Column(BigInteger)
    stock = Column(Integer, default=0)
    
    # Relationships
    product = relationship("Product", back_populates="variants")


class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String(1000), nullable=False)
    is_main = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    # Relationships
    product = relationship("Product", back_populates="images")


# ========== Order ==========
class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index('idx_orders_user', 'user_id'),
        Index('idx_orders_status', 'status'),
        Index('idx_orders_created', 'created_at'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    subtotal_krw = Column(BigInteger, default=0, nullable=False)
    shipping_cost_krw = Column(BigInteger, default=0, nullable=False)
    tax_krw = Column(BigInteger, default=0)
    total_amount = Column(BigInteger, default=0, nullable=False)
    
    # Shipping info (snapshot at order time)
    shipping_name = Column(String(100), nullable=False)
    shipping_phone = Column(String(20), nullable=False)
    shipping_zip_code = Column(String(10), nullable=False)
    shipping_address1 = Column(String(255), nullable=False)
    shipping_address2 = Column(String(255))
    
    payment_method = Column(String(50))
    payment_id = Column(String(100))
    paid_at = Column(DateTime(timezone=True))
    
    note = Column(Text)
    admin_note = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    external_orders = relationship("ExternalOrder", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    
    # Snapshot at order time (in case product is deleted/changed)
    product_title = Column(String(500), nullable=False)
    variant_name = Column(String(200))
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(BigInteger, nullable=False)  # KRW per item
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")


# ========== External Order (공급자 발주) ==========
class ExternalOrder(Base):
    __tablename__ = "external_orders"
    __table_args__ = (
        Index('idx_external_orders_status', 'status'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    
    external_order_id = Column(String(100))  # ID from supplier
    status = Column(Enum(ExternalOrderStatus), default=ExternalOrderStatus.PENDING, nullable=False)
    
    attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    raw_response = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="external_orders")
    supplier = relationship("Supplier", back_populates="external_orders")
    shipments = relationship("Shipment", back_populates="external_order", cascade="all, delete-orphan")


# ========== Shipment (배송) ==========
class Shipment(Base):
    __tablename__ = "shipments"
    __table_args__ = (
        Index('idx_shipments_tracking', 'tracking_number'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    external_order_id = Column(Integer, ForeignKey("external_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    tracking_number = Column(String(100), index=True)
    courier = Column(String(100))
    courier_url = Column(String(500))
    
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.PENDING, nullable=False)
    shipped_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    
    last_checked_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    external_order = relationship("ExternalOrder", back_populates="shipments")
    events = relationship("ShipmentEvent", back_populates="shipment", cascade="all, delete-orphan")


# ========== ShipmentEvent (배송 이력) ==========
class ShipmentEvent(Base):
    __tablename__ = "shipment_events"
    
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(String(100), nullable=False)
    description = Column(Text)
    location = Column(String(255))
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    shipment = relationship("Shipment", back_populates="events")
