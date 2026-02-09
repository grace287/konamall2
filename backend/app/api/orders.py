"""
Orders API Router
주문 생성·조회 API
"""
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_db
from app.db.models import User, Order, OrderItem, OrderStatus, Cart, CartItem, Address, Product
from app.schemas.order import OrderCreate, OrderOut, OrderDetailOut, OrderListOut, OrderItemOut
from app.core.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["Orders"])


def _order_to_out(order: Order) -> OrderOut:
    """Order 모델 → OrderOut (payment_status는 paid_at 기준)."""
    payment_status = "completed" if order.paid_at else "pending"
    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        status=OrderStatus(order.status.value) if hasattr(order.status, "value") else OrderStatus(order.status),
        payment_status=payment_status,
        total_amount=int(order.total_amount or 0),
        items_count=len(order.items),
        created_at=order.created_at,
    )


@router.get("", response_model=OrderListOut)
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """내 주문 목록 (페이지네이션)."""
    q = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return OrderListOut(
        items=[_order_to_out(o) for o in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{order_id}", response_model=OrderDetailOut)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """주문 상세 조회 (본인만)."""
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주문을 찾을 수 없습니다.")
    payment_status = "completed" if order.paid_at else "pending"
    items_out = [
        OrderItemOut(
            id=oi.id,
            product_id=oi.product_id,
            product_title=oi.product_name or "",
            variant_name=None,
            quantity=oi.quantity,
            unit_price=int(oi.unit_price or 0),
            image_url=None,
        )
        for oi in order.items
    ]
    return OrderDetailOut(
        id=order.id,
        order_number=order.order_number,
        status=OrderStatus(order.status.value) if hasattr(order.status, "value") else OrderStatus(order.status),
        payment_status=payment_status,
        total_amount=int(order.total_amount or 0),
        items_count=len(order.items),
        created_at=order.created_at,
        items=items_out,
        subtotal_krw=int((order.total_amount or 0) - (order.shipping_fee or 0)),
        shipping_cost_krw=int(order.shipping_fee or 0),
        tax_krw=0,
        shipping_name=order.recipient_name or "",
        shipping_phone=order.recipient_phone or "",
        shipping_zip_code=order.recipient_postal_code or "",
        shipping_address1=order.recipient_address or "",
        shipping_address2=None,
        payment_method=order.payment_method,
        paid_at=order.paid_at,
        note=order.notes,
    )


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """장바구니 기반 주문 생성. 주소는 address_id로 지정."""
    address = db.query(Address).filter(Address.id == body.address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="배송지를 찾을 수 없습니다.")
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="장바구니가 비어 있습니다.")
    total = 0
    order_items_data = []
    for ci in cart.items:
        price = ci.product.price_final if ci.product else 0
        if getattr(ci, "variant", None) and getattr(ci.variant, "price_krw", None):
            price = int(ci.variant.price_krw)
        line_total = price * ci.quantity
        total += line_total
        order_items_data.append(
            {
                "product_id": ci.product_id,
                "product_name": (ci.product.name_ko or ci.product.name) if ci.product else "",
                "product_sku": ci.product.sku if ci.product else None,
                "quantity": ci.quantity,
                "unit_price": price,
                "total_price": line_total,
                "variant_id": getattr(ci, "variant_id", None),
            }
        )
    shipping_fee = 0 if total >= 50000 else 3000
    total += shipping_fee
    order_number = f"KM{uuid.uuid4().hex[:12].upper()}"
    try:
        order = Order(
            user_id=current_user.id,
            order_number=order_number,
            status=OrderStatus.PENDING,
            total_amount=total,
            shipping_fee=shipping_fee,
            discount_amount=0,
            currency="KRW",
            shipping_address_id=address.id,
            recipient_name=address.recipient_name,
            recipient_phone=address.phone,
            recipient_address=f"{address.address_line1} {address.address_line2 or ''}".strip(),
            recipient_postal_code=address.postal_code,
            payment_method=body.payment_method.value if hasattr(body.payment_method, "value") else body.payment_method,
            notes=body.note,
        )
        db.add(order)
        db.flush()
        for d in order_items_data:
            oi = OrderItem(
                order_id=order.id,
                product_id=d["product_id"],
                product_name=d["product_name"],
                product_sku=d["product_sku"],
                quantity=d["quantity"],
                unit_price=d["unit_price"],
                total_price=d["total_price"],
                variant_id=d.get("variant_id"),
            )
            db.add(oi)
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
        db.refresh(order)
        return _order_to_out(order)
    except SQLAlchemyError as e:
        db.rollback()
        logger.exception("Order creation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="주문 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        )
