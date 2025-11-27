"""
Payment Gateway Module
결제 연동 모듈 (카카오페이, 네이버페이)
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import httpx
import hashlib
import hmac
import time
import logging

logger = logging.getLogger(__name__)


class PaymentStatus(str, Enum):
    PENDING = "pending"
    READY = "ready"
    APPROVED = "approved"
    CANCELLED = "cancelled"
    FAILED = "failed"


@dataclass
class PaymentResult:
    """결제 결과"""
    success: bool
    payment_id: str
    status: PaymentStatus
    message: str
    data: Dict[str, Any]


class BasePaymentGateway(ABC):
    """결제 게이트웨이 기본 클래스"""
    
    @abstractmethod
    async def prepare(
        self,
        order_id: str,
        amount: int,
        item_name: str,
        user_id: str,
        **kwargs
    ) -> PaymentResult:
        """결제 준비 (결제창 URL 생성)"""
        pass
    
    @abstractmethod
    async def approve(
        self,
        payment_id: str,
        pg_token: str,
        **kwargs
    ) -> PaymentResult:
        """결제 승인"""
        pass
    
    @abstractmethod
    async def cancel(
        self,
        payment_id: str,
        amount: int,
        reason: str,
        **kwargs
    ) -> PaymentResult:
        """결제 취소"""
        pass
    
    @abstractmethod
    async def get_status(self, payment_id: str) -> PaymentResult:
        """결제 상태 조회"""
        pass


class KakaoPayGateway(BasePaymentGateway):
    """카카오페이 결제 게이트웨이"""
    
    BASE_URL = "https://kapi.kakao.com"
    
    def __init__(
        self,
        admin_key: str,
        cid: str = "TC0ONETIME",  # 테스트용 CID
        approval_url: str = "",
        cancel_url: str = "",
        fail_url: str = ""
    ):
        self.admin_key = admin_key
        self.cid = cid
        self.approval_url = approval_url
        self.cancel_url = cancel_url
        self.fail_url = fail_url
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"KakaoAK {self.admin_key}",
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        }
    
    async def prepare(
        self,
        order_id: str,
        amount: int,
        item_name: str,
        user_id: str,
        quantity: int = 1,
        **kwargs
    ) -> PaymentResult:
        """
        카카오페이 결제 준비
        
        Returns:
            PaymentResult with:
                - data.tid: 결제 고유번호
                - data.next_redirect_pc_url: PC 결제 페이지 URL
                - data.next_redirect_mobile_url: 모바일 결제 페이지 URL
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v1/payment/ready",
                    headers=self._get_headers(),
                    data={
                        "cid": self.cid,
                        "partner_order_id": order_id,
                        "partner_user_id": user_id,
                        "item_name": item_name,
                        "quantity": quantity,
                        "total_amount": amount,
                        "tax_free_amount": 0,
                        "approval_url": f"{self.approval_url}?order_id={order_id}",
                        "cancel_url": f"{self.cancel_url}?order_id={order_id}",
                        "fail_url": f"{self.fail_url}?order_id={order_id}"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return PaymentResult(
                        success=True,
                        payment_id=data["tid"],
                        status=PaymentStatus.READY,
                        message="결제 준비 완료",
                        data={
                            "tid": data["tid"],
                            "next_redirect_pc_url": data.get("next_redirect_pc_url"),
                            "next_redirect_mobile_url": data.get("next_redirect_mobile_url"),
                            "next_redirect_app_url": data.get("next_redirect_app_url"),
                            "created_at": data.get("created_at")
                        }
                    )
                else:
                    error_data = response.json()
                    return PaymentResult(
                        success=False,
                        payment_id="",
                        status=PaymentStatus.FAILED,
                        message=error_data.get("msg", "결제 준비 실패"),
                        data=error_data
                    )
                    
            except Exception as e:
                logger.error(f"KakaoPay prepare error: {e}")
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )
    
    async def approve(
        self,
        payment_id: str,
        pg_token: str,
        order_id: str = "",
        user_id: str = "",
        **kwargs
    ) -> PaymentResult:
        """카카오페이 결제 승인"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v1/payment/approve",
                    headers=self._get_headers(),
                    data={
                        "cid": self.cid,
                        "tid": payment_id,
                        "partner_order_id": order_id,
                        "partner_user_id": user_id,
                        "pg_token": pg_token
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return PaymentResult(
                        success=True,
                        payment_id=data["tid"],
                        status=PaymentStatus.APPROVED,
                        message="결제 승인 완료",
                        data={
                            "aid": data.get("aid"),  # 요청 고유번호
                            "tid": data["tid"],
                            "payment_method_type": data.get("payment_method_type"),
                            "amount": data.get("amount"),
                            "approved_at": data.get("approved_at")
                        }
                    )
                else:
                    error_data = response.json()
                    return PaymentResult(
                        success=False,
                        payment_id=payment_id,
                        status=PaymentStatus.FAILED,
                        message=error_data.get("msg", "결제 승인 실패"),
                        data=error_data
                    )
                    
            except Exception as e:
                logger.error(f"KakaoPay approve error: {e}")
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )
    
    async def cancel(
        self,
        payment_id: str,
        amount: int,
        reason: str = "사용자 요청",
        **kwargs
    ) -> PaymentResult:
        """카카오페이 결제 취소"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v1/payment/cancel",
                    headers=self._get_headers(),
                    data={
                        "cid": self.cid,
                        "tid": payment_id,
                        "cancel_amount": amount,
                        "cancel_tax_free_amount": 0
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return PaymentResult(
                        success=True,
                        payment_id=data["tid"],
                        status=PaymentStatus.CANCELLED,
                        message="결제 취소 완료",
                        data=data
                    )
                else:
                    error_data = response.json()
                    return PaymentResult(
                        success=False,
                        payment_id=payment_id,
                        status=PaymentStatus.FAILED,
                        message=error_data.get("msg", "결제 취소 실패"),
                        data=error_data
                    )
                    
            except Exception as e:
                logger.error(f"KakaoPay cancel error: {e}")
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )
    
    async def get_status(self, payment_id: str) -> PaymentResult:
        """카카오페이 결제 상태 조회"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v1/payment/order",
                    headers=self._get_headers(),
                    data={
                        "cid": self.cid,
                        "tid": payment_id
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    status_map = {
                        "READY": PaymentStatus.READY,
                        "SUCCESS_PAYMENT": PaymentStatus.APPROVED,
                        "CANCEL_PAYMENT": PaymentStatus.CANCELLED,
                        "PART_CANCEL_PAYMENT": PaymentStatus.CANCELLED,
                        "FAIL_PAYMENT": PaymentStatus.FAILED
                    }
                    return PaymentResult(
                        success=True,
                        payment_id=payment_id,
                        status=status_map.get(data.get("status"), PaymentStatus.PENDING),
                        message="조회 완료",
                        data=data
                    )
                else:
                    return PaymentResult(
                        success=False,
                        payment_id=payment_id,
                        status=PaymentStatus.FAILED,
                        message="조회 실패",
                        data=response.json()
                    )
                    
            except Exception as e:
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )


class NaverPayGateway(BasePaymentGateway):
    """네이버페이 결제 게이트웨이"""
    
    BASE_URL = "https://dev.apis.naver.com"  # 개발: dev, 운영: apis
    
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        chain_id: str,
        return_url: str = ""
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.chain_id = chain_id
        self.return_url = return_url
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    
    def _generate_signature(self, data: str) -> str:
        """HMAC-SHA256 서명 생성"""
        return hmac.new(
            self.client_secret.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    async def prepare(
        self,
        order_id: str,
        amount: int,
        item_name: str,
        user_id: str,
        **kwargs
    ) -> PaymentResult:
        """
        네이버페이 결제 준비
        
        Returns:
            PaymentResult with data.payment_url
        """
        async with httpx.AsyncClient() as client:
            try:
                merchant_pay_key = f"{order_id}_{int(time.time())}"
                
                response = await client.post(
                    f"{self.BASE_URL}/naverpay-partner/naverpay/payments/v2.2/reserve",
                    headers=self._get_headers(),
                    data={
                        "merchantPayKey": merchant_pay_key,
                        "productName": item_name,
                        "totalPayAmount": amount,
                        "taxScopeAmount": amount,
                        "taxExScopeAmount": 0,
                        "returnUrl": f"{self.return_url}?order_id={order_id}",
                        "productCount": kwargs.get("quantity", 1)
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Success":
                        return PaymentResult(
                            success=True,
                            payment_id=data["body"]["paymentId"],
                            status=PaymentStatus.READY,
                            message="결제 준비 완료",
                            data={
                                "payment_id": data["body"]["paymentId"],
                                "payment_url": data["body"].get("redirectUrl"),
                                "merchant_pay_key": merchant_pay_key
                            }
                        )
                    else:
                        return PaymentResult(
                            success=False,
                            payment_id="",
                            status=PaymentStatus.FAILED,
                            message=data.get("message", "결제 준비 실패"),
                            data=data
                        )
                else:
                    return PaymentResult(
                        success=False,
                        payment_id="",
                        status=PaymentStatus.FAILED,
                        message="결제 준비 실패",
                        data=response.json()
                    )
                    
            except Exception as e:
                logger.error(f"NaverPay prepare error: {e}")
                return PaymentResult(
                    success=False,
                    payment_id="",
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )
    
    async def approve(
        self,
        payment_id: str,
        pg_token: str = "",  # NaverPay는 pg_token 불필요
        **kwargs
    ) -> PaymentResult:
        """네이버페이 결제 승인"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/naverpay-partner/naverpay/payments/v2.2/apply/payment",
                    headers=self._get_headers(),
                    data={"paymentId": payment_id}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Success":
                        body = data.get("body", {})
                        return PaymentResult(
                            success=True,
                            payment_id=payment_id,
                            status=PaymentStatus.APPROVED,
                            message="결제 승인 완료",
                            data={
                                "payment_id": payment_id,
                                "total_pay_amount": body.get("totalPayAmount"),
                                "payment_date": body.get("paymentDate"),
                                "card_info": body.get("cardInfo"),
                                "bank_info": body.get("bankInfo")
                            }
                        )
                    else:
                        return PaymentResult(
                            success=False,
                            payment_id=payment_id,
                            status=PaymentStatus.FAILED,
                            message=data.get("message", "결제 승인 실패"),
                            data=data
                        )
                else:
                    return PaymentResult(
                        success=False,
                        payment_id=payment_id,
                        status=PaymentStatus.FAILED,
                        message="결제 승인 실패",
                        data=response.json()
                    )
                    
            except Exception as e:
                logger.error(f"NaverPay approve error: {e}")
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )
    
    async def cancel(
        self,
        payment_id: str,
        amount: int,
        reason: str = "사용자 요청",
        **kwargs
    ) -> PaymentResult:
        """네이버페이 결제 취소"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/naverpay-partner/naverpay/payments/v1/cancel",
                    headers=self._get_headers(),
                    data={
                        "paymentId": payment_id,
                        "cancelAmount": amount,
                        "cancelReason": reason,
                        "cancelRequester": "2"  # 1: 구매자, 2: 가맹점
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Success":
                        return PaymentResult(
                            success=True,
                            payment_id=payment_id,
                            status=PaymentStatus.CANCELLED,
                            message="결제 취소 완료",
                            data=data.get("body", {})
                        )
                    else:
                        return PaymentResult(
                            success=False,
                            payment_id=payment_id,
                            status=PaymentStatus.FAILED,
                            message=data.get("message", "결제 취소 실패"),
                            data=data
                        )
                else:
                    return PaymentResult(
                        success=False,
                        payment_id=payment_id,
                        status=PaymentStatus.FAILED,
                        message="결제 취소 실패",
                        data=response.json()
                    )
                    
            except Exception as e:
                logger.error(f"NaverPay cancel error: {e}")
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )
    
    async def get_status(self, payment_id: str) -> PaymentResult:
        """네이버페이 결제 상태 조회"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.BASE_URL}/naverpay-partner/naverpay/payments/v2.2/list/history",
                    headers=self._get_headers(),
                    data={"paymentId": payment_id}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Success":
                        body = data.get("body", {})
                        status_map = {
                            "RESERVED": PaymentStatus.READY,
                            "SUCCESS": PaymentStatus.APPROVED,
                            "CANCELED": PaymentStatus.CANCELLED,
                            "FAILED": PaymentStatus.FAILED
                        }
                        return PaymentResult(
                            success=True,
                            payment_id=payment_id,
                            status=status_map.get(
                                body.get("paymentStatus"),
                                PaymentStatus.PENDING
                            ),
                            message="조회 완료",
                            data=body
                        )
                else:
                    return PaymentResult(
                        success=False,
                        payment_id=payment_id,
                        status=PaymentStatus.FAILED,
                        message="조회 실패",
                        data=response.json()
                    )
                    
            except Exception as e:
                return PaymentResult(
                    success=False,
                    payment_id=payment_id,
                    status=PaymentStatus.FAILED,
                    message=str(e),
                    data={}
                )


# Payment Gateway Factory
def get_payment_gateway(
    gateway_type: str,
    **config
) -> Optional[BasePaymentGateway]:
    """결제 게이트웨이 인스턴스 생성"""
    gateways = {
        "kakao_pay": KakaoPayGateway,
        "naver_pay": NaverPayGateway
    }
    
    gateway_class = gateways.get(gateway_type)
    if gateway_class:
        return gateway_class(**config)
    return None
