import hashlib
import hmac
import logging
import time
from typing import Any, Dict, List, Optional

import httpx
from .base import BaseConnector
from .exceptions import (
    ConnectorAPIError,
    ConnectorAuthError,
    ConnectorRateLimitError,
    ConnectorResponseError,
    ConnectorTimeoutError,
)

logger = logging.getLogger(__name__)


class AliExpressConnector(BaseConnector):
    """
    AliExpress 공급처 커넥터 (스텁 구현)
    실제 구현 시 AliExpress Open API 연동 필요
    https://developers.aliexpress.com/
    """
    
    BASE_URL = "https://api-sg.aliexpress.com"
    TIMEOUT_SECONDS = 15
    MAX_RETRIES = 3

    def _is_test_mode(self, config: Optional[Dict[str, Any]]) -> bool:
        cfg = config or self.config or {}
        return bool(cfg.get("test_mode"))

    def _build_auth_params(self, api_key: str, api_secret: str, method: str, extra: Dict[str, Any]) -> Dict[str, Any]:
        if not api_key or not api_secret:
            raise ConnectorAuthError("AliExpress api_key/api_secret is required")

        params: Dict[str, Any] = {
            "app_key": api_key,
            "method": method,
            "timestamp": int(time.time() * 1000),
            "format": "json",
            "v": "2.0",
            "sign_method": "sha256",
            **extra,
        }
        sign_source = "".join(f"{k}{params[k]}" for k in sorted(params))
        params["sign"] = hmac.new(api_secret.encode("utf-8"), sign_source.encode("utf-8"), hashlib.sha256).hexdigest().upper()
        return params

    def _request(self, *, api_key: str, api_secret: str, method: str, extra_params: Dict[str, Any]) -> Dict[str, Any]:
        params = self._build_auth_params(api_key, api_secret, method, extra_params)
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                with httpx.Client(timeout=self.TIMEOUT_SECONDS) as client:
                    response = client.get(f"{self.BASE_URL}/sync", params=params)

                if response.status_code == 401:
                    raise ConnectorAuthError("AliExpress authentication failed")
                if response.status_code == 429:
                    logger.warning("AliExpress rate limited: method=%s attempt=%s", method, attempt)
                    if attempt == self.MAX_RETRIES:
                        raise ConnectorRateLimitError("AliExpress API rate limited")
                    time.sleep(min(2 ** attempt, 8))
                    continue
                if response.status_code >= 500 and attempt < self.MAX_RETRIES:
                    logger.warning("AliExpress upstream error: status=%s method=%s attempt=%s", response.status_code, method, attempt)
                    time.sleep(min(2 ** attempt, 8))
                    continue

                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    raise ConnectorResponseError("AliExpress API returned non-object JSON")
                return data
            except httpx.TimeoutException as exc:
                logger.warning("AliExpress timeout: method=%s attempt=%s", method, attempt)
                if attempt == self.MAX_RETRIES:
                    raise ConnectorTimeoutError("AliExpress API timed out") from exc
            except httpx.HTTPStatusError as exc:
                code = exc.response.status_code
                raise ConnectorAPIError(
                    f"AliExpress API error ({code})",
                    status_code=code,
                    retryable=code >= 500,
                ) from exc
            except httpx.HTTPError as exc:
                if attempt == self.MAX_RETRIES:
                    raise ConnectorAPIError("AliExpress transport error", retryable=True) from exc
        raise ConnectorAPIError("AliExpress request retries exhausted", retryable=True)

    def _normalize_product(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "external_id": str(raw.get("product_id") or raw.get("item_id") or ""),
            "price": float(raw.get("sale_price", raw.get("price", 0))),
            "stock": int(raw.get("available_stock", raw.get("stock", 0))),
            "variants": [
                {
                    "id": str(v.get("sku_id") or ""),
                    "sku": v.get("sku_attr"),
                    "name": v.get("sku_name"),
                    "price": float(v.get("sku_price", 0)),
                    "stock": int(v.get("sku_stock", 0)),
                }
                for v in raw.get("sku_infos", [])
            ],
            "title": raw.get("subject"),
            "images": raw.get("images", []),
        }

    def fetch_products(
        self,
        api_key: str = None,
        api_secret: str = None,
        config: Dict = None,
        limit: int = 100,
        category: str = None
    ) -> List[Dict]:
        if self._is_test_mode(config):
            return self._fetch_products_test_data(limit)

        payload = {
            "page_size": min(limit, 200),
            "category_id": category,
        }
        data = self._request(
            api_key=api_key,
            api_secret=api_secret,
            method="aliexpress.ds.product.get",
            extra_params={k: v for k, v in payload.items() if v is not None},
        )
        products = data.get("result", {}).get("products", [])
        if not isinstance(products, list):
            raise ConnectorResponseError("AliExpress products payload is invalid")
        return [self._normalize_product(p) for p in products]

    def _fetch_products_test_data(self, limit: int) -> List[Dict]:
        return [{"external_id": f"ali-test-{i}", "price": 2.5 + i, "stock": 30, "variants": []} for i in range(min(limit, 5))]
    
    def get_product(
        self,
        api_key: str,
        api_secret: str,
        external_id: str
    ) -> Optional[Dict]:
        """단일 상품 조회"""
        return {
            "external_id": external_id,
            "title": f"AliExpress Product {external_id}",
            "title_ko": f"알리익스프레스 상품 {external_id}",
            "price": 7.99,
            "stock": 300,
            "images": ["https://picsum.photos/400/400"],
            "description": "Product description"
        }
    
    def place_order(
        self,
        api_key: str,
        api_secret: str,
        order_data: Dict
    ) -> Dict:
        if self._is_test_mode(order_data.get("config") if isinstance(order_data, dict) else None):
            return {"order_id": "ALI-TEST-ORDER", "status": "placed"}

        data = self._request(
            api_key=api_key,
            api_secret=api_secret,
            method="aliexpress.trade.order.create",
            extra_params={"param_order_request": order_data},
        )
        result = data.get("result", {})
        order_id = result.get("order_id")
        if not order_id:
            raise ConnectorResponseError("AliExpress order response missing order_id")
        return {"order_id": str(order_id), "status": result.get("status", "placed"), "raw": data}
    
    def cancel_order(
        self,
        api_key: str,
        api_secret: str,
        order_id: str
    ) -> Dict:
        """주문 취소"""
        return {
            "order_id": order_id,
            "status": "cancelled",
            "message": "Order cancelled successfully"
        }
    
    def get_order_status(
        self,
        api_key: str,
        api_secret: str,
        order_id: str
    ) -> Dict:
        data = self._request(
            api_key=api_key,
            api_secret=api_secret,
            method="aliexpress.trade.order.get",
            extra_params={"order_id": order_id},
        )
        result = data.get("result", {})
        status = result.get("order_status")
        if not status:
            raise ConnectorResponseError("AliExpress order status missing order_status")
        return {
            "order_id": order_id,
            "status": status,
            "tracking_number": result.get("tracking_number"),
            "courier": result.get("logistics_provider"),
            "raw": data,
        }
    
    def get_tracking_info(
        self,
        tracking_number: str,
        courier: str = None
    ) -> Dict:
        """배송 추적 정보 조회"""
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        
        return {
            "current_status": "in_transit",
            "events": [
                {
                    "status": "in_transit",
                    "description": "Departed from origin country",
                    "location": "Guangzhou, China",
                    "time": now - timedelta(days=3)
                },
                {
                    "status": "processing",
                    "description": "Package processed at facility",
                    "location": "Shenzhen, China",
                    "time": now - timedelta(days=4)
                },
                {
                    "status": "picked_up",
                    "description": "Package received by carrier",
                    "location": "Seller Warehouse",
                    "time": now - timedelta(days=6)
                }
            ]
        }
    
    def check_stock(
        self,
        api_key: str,
        api_secret: str,
        product_id: str,
        variant_id: str = None
    ) -> Dict:
        """재고 확인"""
        import random
        return {
            "product_id": product_id,
            "variant_id": variant_id,
            "in_stock": True,
            "quantity": random.randint(50, 500)
        }
    
    def calculate_shipping(
        self,
        api_key: str,
        api_secret: str,
        product_ids: List[str],
        destination_country: str,
        destination_zip: str = None
    ) -> Dict:
        """배송비 계산"""
        shipping_options = [
            {
                "method": "AliExpress Standard Shipping",
                "estimated_days": "15-25",
                "cost": 0.0,
                "currency": "USD"
            },
            {
                "method": "ePacket",
                "estimated_days": "12-20",
                "cost": 2.99,
                "currency": "USD"
            },
            {
                "method": "DHL Express",
                "estimated_days": "7-10",
                "cost": 15.99,
                "currency": "USD"
            }
        ]
        return {
            "destination_country": destination_country,
            "options": shipping_options
        }
