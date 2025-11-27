"""
Payment API Router
결제 API 라우터
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.db.session import get_db
from app.db.models import Order, User, OrderStatus, PaymentStatus as DBPaymentStatus
from app.core.deps import get_current_user
from app.core.config import settings
from app.services.payment import (
    get_payment_gateway,
    PaymentResult,
    PaymentStatus
)
from app.tasks.order_process import process_order

router = APIRouter(prefix="/payments", tags=["Payments"])


# ========== Schemas ==========
class PaymentPrepareRequest(BaseModel):
    order_id: int
    payment_method: str  # kakao_pay, naver_pay


class PaymentPrepareResponse(BaseModel):
    success: bool
    payment_id: str
    redirect_url: str
    message: str


class PaymentApproveRequest(BaseModel):
    order_id: int
    payment_id: str
    pg_token: Optional[str] = None  # 카카오페이용


class PaymentApproveResponse(BaseModel):
    success: bool
    order_id: int
    order_number: str
    payment_id: str
    status: str
    message: str


class PaymentCancelRequest(BaseModel):
    order_id: int
    reason: str = "사용자 요청"


# ========== Helper Functions ==========
def get_gateway_config(payment_method: str) -> dict:
    """결제 게이트웨이 설정 반환"""
    base_url = getattr(settings, 'BASE_URL', 'http://localhost:3000')
    
    if payment_method == "kakao_pay":
        return {
            "admin_key": getattr(settings, 'KAKAO_PAY_ADMIN_KEY', 'test_admin_key'),
            "cid": getattr(settings, 'KAKAO_PAY_CID', 'TC0ONETIME'),
            "approval_url": f"{base_url}/payment/success",
            "cancel_url": f"{base_url}/payment/cancel",
            "fail_url": f"{base_url}/payment/fail"
        }
    elif payment_method == "naver_pay":
        return {
            "client_id": getattr(settings, 'NAVER_PAY_CLIENT_ID', 'test_client_id'),
            "client_secret": getattr(settings, 'NAVER_PAY_CLIENT_SECRET', 'test_secret'),
            "chain_id": getattr(settings, 'NAVER_PAY_CHAIN_ID', 'test_chain'),
            "return_url": f"{base_url}/payment/success"
        }
    else:
        raise ValueError(f"Unknown payment method: {payment_method}")


# ========== Endpoints ==========
@router.post("/prepare", response_model=PaymentPrepareResponse)
async def prepare_payment(
    request: PaymentPrepareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    결제 준비 (결제창 URL 생성)
    
    - 주문 정보 확인
    - 결제 게이트웨이에 준비 요청
    - 결제창 URL 반환
    """
    # 주문 확인
    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="주문을 찾을 수 없습니다"
        )
    
    # 이미 결제된 주문인지 확인
    if order.payment_status == DBPaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 결제가 완료된 주문입니다"
        )
    
    # 취소된 주문인지 확인
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="취소된 주문입니다"
        )
    
    # 게이트웨이 설정
    try:
        config = get_gateway_config(request.payment_method)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    gateway = get_payment_gateway(request.payment_method, **config)
    if not gateway:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원하지 않는 결제 방식입니다"
        )
    
    # 상품명 생성
    items_count = len(order.items)
    if items_count > 0:
        first_item = order.items[0].product_title
        if items_count > 1:
            item_name = f"{first_item} 외 {items_count - 1}건"
        else:
            item_name = first_item
    else:
        item_name = f"주문번호 {order.order_number}"
    
    # 결제 준비 요청
    result = await gateway.prepare(
        order_id=order.order_number,
        amount=order.total_amount,
        item_name=item_name,
        user_id=str(current_user.id),
        quantity=items_count
    )
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    # 결제 정보 저장
    order.payment_method = request.payment_method
    order.payment_id = result.payment_id
    db.commit()
    
    # 리다이렉트 URL 결정
    redirect_url = (
        result.data.get("next_redirect_pc_url") or
        result.data.get("payment_url") or
        result.data.get("redirect_url", "")
    )
    
    return PaymentPrepareResponse(
        success=True,
        payment_id=result.payment_id,
        redirect_url=redirect_url,
        message="결제 준비 완료"
    )


@router.post("/approve", response_model=PaymentApproveResponse)
async def approve_payment(
    request: PaymentApproveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    결제 승인
    
    - 결제 게이트웨이에 승인 요청
    - 주문 상태 업데이트
    - 주문 처리 태스크 시작
    """
    # 주문 확인
    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="주문을 찾을 수 없습니다"
        )
    
    # 결제 ID 확인
    if order.payment_id != request.payment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="결제 정보가 일치하지 않습니다"
        )
    
    # 게이트웨이 설정
    payment_method = order.payment_method
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="결제 방식 정보가 없습니다"
        )
    
    config = get_gateway_config(payment_method)
    gateway = get_payment_gateway(payment_method, **config)
    
    # 결제 승인 요청
    result = await gateway.approve(
        payment_id=request.payment_id,
        pg_token=request.pg_token or "",
        order_id=order.order_number,
        user_id=str(current_user.id)
    )
    
    if not result.success:
        order.payment_status = DBPaymentStatus.FAILED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    # 주문 상태 업데이트
    order.payment_status = DBPaymentStatus.COMPLETED
    order.status = OrderStatus.PAID
    order.paid_at = datetime.utcnow()
    db.commit()
    
    # 주문 처리 태스크 시작 (Celery)
    try:
        process_order.delay(order.id)
    except Exception as e:
        # Celery 연결 실패해도 결제는 성공으로 처리
        pass
    
    return PaymentApproveResponse(
        success=True,
        order_id=order.id,
        order_number=order.order_number,
        payment_id=result.payment_id,
        status="paid",
        message="결제가 완료되었습니다"
    )


@router.get("/approve")
async def approve_payment_callback(
    order_id: str = Query(...),
    pg_token: Optional[str] = Query(None),
    paymentId: Optional[str] = Query(None),  # 네이버페이
    db: Session = Depends(get_db)
):
    """
    결제 승인 콜백 (결제 게이트웨이에서 리다이렉트)
    
    프론트엔드에서 처리할 정보를 반환
    """
    # order_number로 주문 찾기
    order = db.query(Order).filter(Order.order_number == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="주문을 찾을 수 없습니다"
        )
    
    payment_id = paymentId or order.payment_id
    
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "payment_id": payment_id,
        "pg_token": pg_token,
        "payment_method": order.payment_method,
        "message": "결제 정보를 확인하고 승인을 완료해주세요"
    }


@router.post("/cancel")
async def cancel_payment(
    request: PaymentCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    결제 취소
    
    - 결제 게이트웨이에 취소 요청
    - 주문 상태 업데이트
    """
    # 주문 확인
    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="주문을 찾을 수 없습니다"
        )
    
    # 취소 가능 상태 확인
    if order.status not in [OrderStatus.PENDING, OrderStatus.PAID]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="취소할 수 없는 주문 상태입니다"
        )
    
    # 결제가 완료된 경우 환불 처리
    if order.payment_status == DBPaymentStatus.COMPLETED and order.payment_id:
        payment_method = order.payment_method
        config = get_gateway_config(payment_method)
        gateway = get_payment_gateway(payment_method, **config)
        
        result = await gateway.cancel(
            payment_id=order.payment_id,
            amount=order.total_amount,
            reason=request.reason
        )
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"결제 취소 실패: {result.message}"
            )
        
        order.payment_status = DBPaymentStatus.REFUNDED
    
    # 주문 상태 업데이트
    order.status = OrderStatus.CANCELLED
    order.admin_note = f"취소 사유: {request.reason}"
    db.commit()
    
    return {
        "success": True,
        "order_id": order.id,
        "status": "cancelled",
        "message": "주문이 취소되었습니다"
    }


@router.get("/status/{order_id}")
async def get_payment_status(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """결제 상태 조회"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="주문을 찾을 수 없습니다"
        )
    
    # 결제 게이트웨이에서 상태 조회
    if order.payment_id and order.payment_method:
        config = get_gateway_config(order.payment_method)
        gateway = get_payment_gateway(order.payment_method, **config)
        
        result = await gateway.get_status(order.payment_id)
        
        return {
            "order_id": order.id,
            "order_number": order.order_number,
            "order_status": order.status.value,
            "payment_status": order.payment_status.value,
            "payment_method": order.payment_method,
            "payment_id": order.payment_id,
            "gateway_status": result.data if result.success else None,
            "total_amount": order.total_amount,
            "paid_at": order.paid_at
        }
    
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "order_status": order.status.value,
        "payment_status": order.payment_status.value,
        "payment_method": order.payment_method,
        "total_amount": order.total_amount,
        "paid_at": order.paid_at
    }
