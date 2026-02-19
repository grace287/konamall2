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


class TemuConnector(BaseConnector):
    """Temu connector based on supplier API requests."""

    BASE_URL = "https://openapi.temu.com"
    TIMEOUT_SECONDS = 15
    MAX_RETRIES = 3

    def _is_test_mode(self, config: Optional[Dict[str, Any]]) -> bool:
        cfg = config or self.config or {}
        return bool(cfg.get("test_mode"))

    def _build_auth_headers(self, api_key: str, api_secret: str, path: str, payload: Dict[str, Any]) -> Dict[str, str]:
        if not api_key or not api_secret:
            raise ConnectorAuthError("Temu API key/secret is required")

        timestamp = str(int(time.time()))
        body = httpx.QueryParams(payload).encode()
        signing_payload = f"{path}\n{timestamp}\n{body}".encode("utf-8")
        signature = hmac.new(api_secret.encode("utf-8"), signing_payload, hashlib.sha256).hexdigest()
        return {
            "X-TEMU-APP-KEY": api_key,
            "X-TEMU-TIMESTAMP": timestamp,
            "X-TEMU-SIGN": signature,
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, *, api_key: str, api_secret: str, params: Optional[Dict[str, Any]] = None, json_body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        params = params or {}
        headers = self._build_auth_headers(api_key, api_secret, path, json_body or params)
        url = f"{self.BASE_URL}{path}"

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                with httpx.Client(timeout=self.TIMEOUT_SECONDS) as client:
                    response = client.request(method=method, url=url, params=params, json=json_body, headers=headers)
                if response.status_code == 401:
                    raise ConnectorAuthError("Temu authentication rejected")
                if response.status_code == 429:
                    logger.warning("Temu rate limited: path=%s attempt=%s", path, attempt)
                    if attempt == self.MAX_RETRIES:
                        raise ConnectorRateLimitError("Temu API rate limited")
                    time.sleep(min(2 ** attempt, 8))
                    continue
                if response.status_code >= 500 and attempt < self.MAX_RETRIES:
                    logger.warning("Temu upstream error: status=%s path=%s attempt=%s", response.status_code, path, attempt)
                    time.sleep(min(2 ** attempt, 8))
                    continue
                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    raise ConnectorResponseError("Temu API returned non-object JSON")
                return data
            except httpx.TimeoutException as exc:
                logger.warning("Temu timeout: path=%s attempt=%s", path, attempt)
                if attempt == self.MAX_RETRIES:
                    raise ConnectorTimeoutError("Temu API timed out") from exc
            except httpx.HTTPStatusError as exc:
                retryable = exc.response.status_code >= 500
                raise ConnectorAPIError(
                    f"Temu API request failed: {exc.response.status_code}",
                    status_code=exc.response.status_code,
                    retryable=retryable,
                ) from exc
            except httpx.HTTPError as exc:
                if attempt == self.MAX_RETRIES:
                    raise ConnectorAPIError("Temu HTTP transport error", retryable=True) from exc
        raise ConnectorAPIError("Temu request retries exhausted", retryable=True)

    def _normalize_product(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        variants = [
            {
                "id": str(v.get("variant_id") or ""),
                "sku": v.get("sku"),
                "name": v.get("name"),
                "price": float(v.get("price", 0)),
                "stock": int(v.get("stock", 0)),
            }
            for v in raw.get("variants", [])
        ]
        return {
            "external_id": str(raw.get("product_id") or raw.get("id") or ""),
            "price": float(raw.get("price", 0)),
            "stock": int(raw.get("stock", 0)),
            "variants": variants,
            "title": raw.get("title"),
            "images": raw.get("images", []),
        }

    def fetch_products(self, api_key: str = None, api_secret: str = None, config: Dict = None, limit: int = 100, category: str = None) -> List[Dict]:
        if self._is_test_mode(config):
            return self._fetch_products_test_data(limit)

        payload = {"limit": limit, "category": category} if category else {"limit": limit}
        data = self._request("GET", "/v1/products", api_key=api_key, api_secret=api_secret, params=payload)
        products = data.get("products", [])
        if not isinstance(products, list):
            raise ConnectorResponseError("Temu products payload is invalid")
        return [self._normalize_product(p) for p in products]

    def _fetch_products_test_data(self, limit: int) -> List[Dict]:
        return [{"external_id": f"temu-test-{i}", "price": 10.0 + i, "stock": 100, "variants": []} for i in range(min(limit, 5))]

    def get_product(self, api_key: str, api_secret: str, external_id: str) -> Optional[Dict]:
        return {
            "external_id": external_id,
            "title": f"Temu Product {external_id}",
            "title_ko": f"테무 상품 {external_id}",
            "price": 9.99,
            "stock": 100,
            "images": ["https://picsum.photos/400/400"],
            "description": "Product description",
        }

    def place_order(self, api_key: str, api_secret: str, order_data: Dict) -> Dict:
        if self._is_test_mode(order_data.get("config") if isinstance(order_data, dict) else None):
            return {"order_id": "TEMU-TEST-ORDER", "status": "placed"}

        data = self._request(
            "POST",
            "/v1/orders",
            api_key=api_key,
            api_secret=api_secret,
            json_body=order_data,
        )
        order_id = data.get("order_id")
        if not order_id:
            raise ConnectorResponseError("Temu order response missing order_id")
        return {"order_id": str(order_id), "status": data.get("status", "placed"), "raw": data}

    def get_order_status(self, api_key: str, api_secret: str, order_id: str) -> Dict:
        data = self._request(
            "GET",
            f"/v1/orders/{order_id}",
            api_key=api_key,
            api_secret=api_secret,
        )
        status = data.get("status")
        if not status:
            raise ConnectorResponseError("Temu order status response missing status")
        return {
            "order_id": order_id,
            "status": status,
            "tracking_number": data.get("tracking_number"),
            "courier": data.get("courier"),
            "raw": data,
        }

    def get_tracking_info(self, tracking_number: str, courier: str = None) -> Dict:
        from datetime import datetime, timedelta

        now = datetime.utcnow()

        return {
            "current_status": "in_transit",
            "events": [
                {
                    "status": "in_transit",
                    "description": "Package in transit to destination country",
                    "location": "Shanghai, China",
                    "time": now - timedelta(days=2),
                },
                {
                    "status": "picked_up",
                    "description": "Package picked up by carrier",
                    "location": "Shenzhen, China",
                    "time": now - timedelta(days=5),
                },
            ],
        }
