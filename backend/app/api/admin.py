"""
Admin API Router
관리자 전용: 회원 목록, 주문 목록, 상품 목록
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.db.models import User, Order, Product
from app.core.deps import get_admin_user
from app.schemas.user import UserOut
from app.schemas.order import OrderOut
from app.schemas.product import ProductOut
from app.db.models import OrderStatus as OrderStatusEnum

router = APIRouter(prefix="/admin", tags=["Admin"])


def _order_to_out(order: Order) -> OrderOut:
    from app.schemas.order import OrderStatus as OrderStatusSchema
    payment_status = "completed" if order.paid_at else "pending"
    st = order.status.value if hasattr(order.status, "value") else str(order.status)
    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        status=OrderStatusSchema(st),
        payment_status=payment_status,
        total_amount=int(order.total_amount or 0),
        items_count=len(order.items),
        created_at=order.created_at,
    )


@router.get("/users", response_model=List[UserOut])
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """관리자: 전체 회원 목록 (가입일 최신순)."""
    q = db.query(User).order_by(User.created_at.desc())
    users = q.offset((page - 1) * limit).limit(limit).all()
    return [
        UserOut(
            id=u.id,
            email=u.email,
            name=u.name,
            phone=u.phone,
            role=u.role.value if hasattr(u.role, "value") else str(u.role),
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/orders", response_model=List[OrderOut])
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None, description="주문 상태 필터"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """관리자: 전체 주문 목록 (최신순)."""
    q = db.query(Order).order_by(Order.created_at.desc())
    if status:
        try:
            q = q.filter(Order.status == OrderStatusEnum(status))
        except ValueError:
            pass
    orders = q.offset((page - 1) * limit).limit(limit).all()
    return [_order_to_out(o) for o in orders]


@router.get("/stats")
async def admin_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """관리자: 대시보드용 간단 통계."""
    users_total = db.query(User).count()
    orders_total = db.query(Order).count()
    orders_paid = db.query(Order).filter(Order.paid_at.isnot(None)).count()
    products_total = db.query(Product).count()
    return {
        "users_total": users_total,
        "orders_total": orders_total,
        "orders_paid": orders_paid,
        "products_total": products_total,
    }


@router.get("/products", response_model=List[ProductOut])
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """관리자: 전체 상품 목록 (최신순)."""
    q = db.query(Product).order_by(Product.created_at.desc())
    if category:
        q = q.filter(Product.category == category)
    products = q.offset((page - 1) * limit).limit(limit).all()
    return products
