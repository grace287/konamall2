"""
Payments API Router
결제 준비·승인·상태 조회 (카카오페이/네이버페이 연동)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.db.models import User, Order
from app.services.payment import get_payment_gateway

router = APIRouter(prefix="/payments", tags=["Payments"])


def _normalize_payment_url(data: dict | None) -> str | None:
    """결제사별 prepare 응답 URL 키를 단일 payment_url로 정규화."""
    if not data:
        return None
    return (
        data.get("payment_url")
        or data.get("next_redirect_pc_url")
        or data.get("next_redirect_mobile_url")
        or data.get("next_redirect_app_url")
        or data.get("redirectUrl")
    )


class PrepareIn(BaseModel):
    order_id: int
    gateway: str = "kakao_pay"  # kakao_pay | naver_pay


class ApproveIn(BaseModel):
    order_id: int
    payment_id: str
    pg_token: str
    gateway: str = "kakao_pay"


@router.post("/prepare")
async def prepare_payment(
    body: PrepareIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """결제 준비 (결제창 URL 등 반환)."""
    order = db.query(Order).filter(Order.id == body.order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주문을 찾을 수 없습니다.")
    if order.paid_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 결제 완료된 주문입니다.")
    gateway = get_payment_gateway(
        body.gateway,
        admin_key=settings.KAKAO_PAY_ADMIN_KEY or "",
        cid=getattr(settings, "KAKAO_PAY_CID", "TC0ONETIME"),
        client_id=getattr(settings, "NAVER_PAY_CLIENT_ID", ""),
        client_secret=getattr(settings, "NAVER_PAY_CLIENT_SECRET", ""),
        chain_id=getattr(settings, "NAVER_PAY_CHAIN_ID", ""),
        approval_url=f"{settings.BASE_URL}/payments/approve",
        cancel_url=f"{settings.BASE_URL}/payments/cancel",
        fail_url=f"{settings.BASE_URL}/payments/fail",
    )
    if not gateway:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="지원하지 않는 결제 수단입니다.")
    amount = int(order.total_amount or 0)
    result = await gateway.prepare(
        order_id=str(order.id),
        amount=amount,
        item_name=f"KonaMall 주문 #{order.order_number}",
        user_id=str(current_user.id),
    )
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    payment_url = _normalize_payment_url(result.data)
    if not payment_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="결제 준비 응답에 리다이렉트 URL이 없습니다.",
        )
    return {
        "payment_id": result.payment_id,
        "payment_url": payment_url,
        "message": result.message,
        "gateway": body.gateway,
    }


@router.post("/approve")
async def approve_payment(
    body: ApproveIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """결제 승인 (PG 리다이렉트 후 pg_token으로 호출). 성공 시 주문에 paid_at, payment_id 반영."""
    gateway = get_payment_gateway(
        body.gateway,
        admin_key=settings.KAKAO_PAY_ADMIN_KEY or "",
        client_id=getattr(settings, "NAVER_PAY_CLIENT_ID", ""),
        client_secret=getattr(settings, "NAVER_PAY_CLIENT_SECRET", ""),
    )
    if not gateway:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="지원하지 않는 결제 수단입니다.")
    result = await gateway.approve(payment_id=body.payment_id, pg_token=body.pg_token)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.message)
    from datetime import datetime
    from app.db.models import OrderStatus
    order = db.query(Order).filter(Order.id == body.order_id, Order.user_id == current_user.id).first()
    if order and not order.paid_at:
        order.payment_id = result.payment_id
        order.paid_at = datetime.utcnow()
        order.status = OrderStatus.PAID
        db.commit()
    return {"success": True, "payment_id": result.payment_id, "status": result.status, "order_id": body.order_id, "data": result.data}


@router.get("/status/{payment_id}")
async def payment_status(
    payment_id: str,
    gateway: str = "kakao_pay",
):
    """결제 상태 조회."""
    gateway_instance = get_payment_gateway(
        gateway,
        admin_key=settings.KAKAO_PAY_ADMIN_KEY or "",
        client_id=getattr(settings, "NAVER_PAY_CLIENT_ID", ""),
        client_secret=getattr(settings, "NAVER_PAY_CLIENT_SECRET", ""),
    )
    if not gateway_instance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="지원하지 않는 결제 수단입니다.")
    result = await gateway_instance.get_status(payment_id)
    return {"payment_id": payment_id, "success": result.success, "status": result.status, "message": result.message}
