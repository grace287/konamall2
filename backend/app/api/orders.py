from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.db.session import get_db
from app.db.models import Order, OrderItem, OrderStatus, Product, ProductVariant, User
from app.schemas.order import OrderCreate, OrderOut, OrderListOut
from app.core.config import settings

router = APIRouter()


def generate_order_number() -> str:
    """주문번호 생성"""
    now = datetime.now()
    return f"KM{now.strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


def calculate_totals(items: List[dict], db: Session) -> dict:
    """주문 금액 계산"""
    subtotal = 0
    for item in items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item["variant_id"]).first()
        if variant:
            subtotal += variant.price_krw * item["quantity"]
    
    shipping = 0 if subtotal >= settings.FREE_SHIPPING_THRESHOLD_KRW else settings.DEFAULT_SHIPPING_COST_KRW
    tax = int(subtotal * 0.1)
    total = subtotal + shipping + tax
    
    return {
        "subtotal_krw": subtotal,
        "shipping_cost_krw": shipping,
        "tax_krw": tax,
        "total_krw": total
    }


@router.post("/", response_model=OrderOut)
async def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """주문 생성"""
    totals = calculate_totals(order_data.items, db)
    
    order = Order(
        user_id=order_data.user_id,
        order_number=generate_order_number(),
        status=OrderStatus.PENDING,
        shipping_name=order_data.shipping_name,
        shipping_phone=order_data.shipping_phone,
        shipping_zip_code=order_data.shipping_zip_code,
        shipping_address1=order_data.shipping_address1,
        shipping_address2=order_data.shipping_address2,
        **totals
    )
    db.add(order)
    db.flush()
    
    # Order items
    for item in order_data.items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item["variant_id"]).first()
        product = db.query(Product).filter(Product.id == item["product_id"]).first()
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=item["product_id"],
            variant_id=item["variant_id"],
            product_title=product.title_ko or product.title,
            variant_name=variant.name if variant else "",
            quantity=item["quantity"],
            price_krw=variant.price_krw if variant else 0
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: Session = Depends(get_db)):
    """주문 상세 조회"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/number/{order_number}")
async def get_order_by_number(order_number: str, db: Session = Depends(get_db)):
    """주문번호로 조회"""
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/user/{user_id}", response_model=OrderListOut)
async def get_user_orders(user_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """사용자 주문 목록"""
    query = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc())
    total = query.count()
    orders = query.offset(skip).limit(limit).all()
    return {"items": orders, "total": total}


@router.patch("/{order_id}/status")
async def update_order_status(order_id: int, status: OrderStatus, db: Session = Depends(get_db)):
    """주문 상태 업데이트"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    db.commit()
    return {"message": "Status updated", "new_status": status}
