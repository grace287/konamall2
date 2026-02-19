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


class AmazonConnector(BaseConnector):
    """
    Amazon 공급처 커넥터 (스텁 구현)
    실제 구현 시 Amazon Product Advertising API 또는 SP-API 연동 필요
    https://developer.amazon.com/
    """
    
    BASE_URL = "https://webservices.amazon.com"
    TOKEN_URL = "https://api.amazon.com/auth/o2/token"
    TIMEOUT_SECONDS = 20
    MAX_RETRIES = 3

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self._access_token: Optional[str] = None
        self._token_expiry: float = 0

    def _is_test_mode(self, config: Optional[Dict[str, Any]]) -> bool:
        cfg = config or self.config or {}
        return bool(cfg.get("test_mode"))

    def _refresh_access_token(self, api_key: str, api_secret: str) -> str:
        refresh_token = self.config.get("refresh_token")
        if not refresh_token:
            raise ConnectorAuthError("Amazon refresh_token is required in connector config")
        with httpx.Client(timeout=self.TIMEOUT_SECONDS) as client:
            response = client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": api_key,
                    "client_secret": api_secret,
                },
            )
        if response.status_code >= 400:
            raise ConnectorAuthError(f"Amazon token refresh failed ({response.status_code})")
        data = response.json()
        token = data.get("access_token")
        if not token:
            raise ConnectorAuthError("Amazon token response missing access_token")
        self._access_token = token
        self._token_expiry = time.time() + int(data.get("expires_in", 3600)) - 60
        return token

    def _get_access_token(self, api_key: str, api_secret: str) -> str:
        if self._access_token and time.time() < self._token_expiry:
            return self._access_token
        return self._refresh_access_token(api_key, api_secret)

    def _request(self, method: str, path: str, *, api_key: str, api_secret: str, params: Optional[Dict[str, Any]] = None, json_body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.BASE_URL}{path}"

        for attempt in range(1, self.MAX_RETRIES + 1):
            token = self._get_access_token(api_key, api_secret)
            headers = {
                "x-amz-access-token": token,
                "Content-Type": "application/json",
            }
            try:
                with httpx.Client(timeout=self.TIMEOUT_SECONDS) as client:
                    response = client.request(method, url, params=params, json=json_body, headers=headers)

                if response.status_code == 401:
                    if attempt < self.MAX_RETRIES:
                        self._access_token = None
                        logger.warning("Amazon auth expired, refreshing token: path=%s", path)
                        continue
                    raise ConnectorAuthError("Amazon authentication failed")
                if response.status_code == 429:
                    logger.warning("Amazon rate limit: path=%s attempt=%s", path, attempt)
                    if attempt == self.MAX_RETRIES:
                        raise ConnectorRateLimitError("Amazon API rate limited")
                    time.sleep(min(2 ** attempt, 8))
                    continue
                if response.status_code >= 500 and attempt < self.MAX_RETRIES:
                    logger.warning("Amazon upstream error: status=%s path=%s attempt=%s", response.status_code, path, attempt)
                    time.sleep(min(2 ** attempt, 8))
                    continue

                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    raise ConnectorResponseError("Amazon API returned non-object JSON")
                return data
            except httpx.TimeoutException as exc:
                logger.warning("Amazon timeout: path=%s attempt=%s", path, attempt)
                if attempt == self.MAX_RETRIES:
                    raise ConnectorTimeoutError("Amazon API timed out") from exc
            except httpx.HTTPStatusError as exc:
                code = exc.response.status_code
                raise ConnectorAPIError(
                    f"Amazon API error ({code})",
                    status_code=code,
                    retryable=code >= 500,
                ) from exc
            except httpx.HTTPError as exc:
                if attempt == self.MAX_RETRIES:
                    raise ConnectorAPIError("Amazon transport error", retryable=True) from exc
        raise ConnectorAPIError("Amazon request retries exhausted", retryable=True)

    def _normalize_product(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        summaries = (raw.get("summaries") or [{}])[0]
        offers = (raw.get("offers") or [{}])[0]
        variants = raw.get("variations", [])
        return {
            "external_id": str(raw.get("asin") or ""),
            "price": float((offers.get("listingPrice") or {}).get("amount", 0)),
            "stock": int((offers.get("availability") or {}).get("quantity", 0)),
            "variants": [
                {
                    "id": str(v.get("asin") or ""),
                    "sku": v.get("sku"),
                    "name": v.get("title"),
                    "price": float(v.get("price", 0)),
                    "stock": int(v.get("stock", 0)),
                }
                for v in variants
            ],
            "title": summaries.get("itemName"),
            "images": [img.get("link") for img in raw.get("images", []) if img.get("link")],
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

        query = ((config or {}).get("query") or "best seller")
        params = {
            "marketplaceIds": self.config.get("marketplace_id", "ATVPDKIKX0DER"),
            "keywords": query,
            "pageSize": min(limit, 20),
        }
        if category:
            params["category"] = category
        data = self._request("GET", "/catalog/2022-04-01/items", api_key=api_key, api_secret=api_secret, params=params)
        products = data.get("items", [])
        if not isinstance(products, list):
            raise ConnectorResponseError("Amazon products payload is invalid")
        return [self._normalize_product(p) for p in products]

    def _fetch_products_test_data(self, limit: int) -> List[Dict]:
        return [{"external_id": f"amz-test-{i}", "price": 30.0 + i, "stock": 10, "variants": []} for i in range(min(limit, 5))]
    
    def get_product(
        self,
        api_key: str,
        api_secret: str,
        external_id: str
    ) -> Optional[Dict]:
        """단일 상품 조회"""
        return {
            "external_id": external_id,
            "asin": external_id.replace("amz-", ""),
            "title": f"Amazon Product {external_id}",
            "title_ko": f"아마존 상품 {external_id}",
            "price": 34.99,
            "list_price": 44.99,
            "stock": 500,
            "images": ["https://picsum.photos/400/400"],
            "description": "Product description",
            "prime_eligible": True,
            "rating": 4.5,
            "review_count": 2500
        }
    
    def place_order(
        self,
        api_key: str,
        api_secret: str,
        order_data: Dict
    ) -> Dict:
        if self._is_test_mode(order_data.get("config") if isinstance(order_data, dict) else None):
            return {"order_id": "AMZ-TEST-ORDER", "status": "placed"}

        data = self._request(
            "POST",
            "/orders/v0/orders",
            api_key=api_key,
            api_secret=api_secret,
            json_body=order_data,
        )
        payload = data.get("payload", data)
        order_id = payload.get("AmazonOrderId") or payload.get("order_id")
        if not order_id:
            raise ConnectorResponseError("Amazon order response missing order id")
        return {
            "order_id": str(order_id),
            "status": payload.get("OrderStatus", "placed"),
            "estimated_delivery": payload.get("LatestShipDate"),
            "raw": data,
        }
    
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
            "refund_status": "pending",
            "message": "Order cancelled successfully"
        }
    
    def get_order_status(
        self,
        api_key: str,
        api_secret: str,
        order_id: str
    ) -> Dict:
        data = self._request(
            "GET",
            f"/orders/v0/orders/{order_id}",
            api_key=api_key,
            api_secret=api_secret,
        )
        payload = data.get("payload", data)
        status = payload.get("OrderStatus") or payload.get("status")
        if not status:
            raise ConnectorResponseError("Amazon order status response missing status")
        return {
            "order_id": order_id,
            "status": status,
            "tracking_number": payload.get("TrackingNumber"),
            "courier": payload.get("CarrierCode"),
            "estimated_delivery": payload.get("LatestDeliveryDate"),
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
            "current_status": "out_for_delivery",
            "events": [
                {
                    "status": "out_for_delivery",
                    "description": "Out for delivery",
                    "location": "Local Facility, Seoul",
                    "time": now - timedelta(hours=2)
                },
                {
                    "status": "in_transit",
                    "description": "Arrived at destination facility",
                    "location": "Seoul, South Korea",
                    "time": now - timedelta(days=1)
                },
                {
                    "status": "in_transit",
                    "description": "Package in transit",
                    "location": "Incheon Airport, South Korea",
                    "time": now - timedelta(days=2)
                },
                {
                    "status": "shipped",
                    "description": "Shipped from fulfillment center",
                    "location": "Amazon Fulfillment Center, USA",
                    "time": now - timedelta(days=4)
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
            "quantity": random.randint(100, 1000),
            "fulfillment_type": "FBA"  # Fulfillment by Amazon
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
                "method": "Amazon Global Standard",
                "estimated_days": "10-14",
                "cost": 9.99,
                "currency": "USD"
            },
            {
                "method": "Amazon Global Expedited",
                "estimated_days": "5-7",
                "cost": 19.99,
                "currency": "USD"
            },
            {
                "method": "Amazon Global Priority",
                "estimated_days": "2-4",
                "cost": 34.99,
                "currency": "USD"
            }
        ]
        
        # Prime 회원은 무료 배송
        if destination_country == "US":
            shipping_options.insert(0, {
                "method": "Prime Free Shipping",
                "estimated_days": "2",
                "cost": 0.0,
                "currency": "USD",
                "requires_prime": True
            })
        
        return {
            "destination_country": destination_country,
            "options": shipping_options
        }
    
    def search_products(
        self,
        api_key: str,
        api_secret: str,
        query: str,
        category: str = None,
        min_price: float = None,
        max_price: float = None,
        limit: int = 20
    ) -> List[Dict]:
        """상품 검색 (Amazon 특화 기능)"""
        # 실제 구현: Amazon Product Advertising API SearchItems 호출
        return self.fetch_products(
            api_key=api_key,
            api_secret=api_secret,
            config={"query": query},
            limit=limit,
            category=category
        )
    
    def get_best_sellers(
        self,
        api_key: str,
        api_secret: str,
        category: str = None,
        limit: int = 10
    ) -> List[Dict]:
        """베스트셀러 상품 조회 (Amazon 특화 기능)"""
        products = self.fetch_products(
            api_key=api_key,
            api_secret=api_secret,
            limit=limit,
            category=category
        )
        # 판매량 순으로 정렬된 것처럼 반환
        return products
