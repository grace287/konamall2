from typing import Optional
from .base import BaseConnector
from .temu import TemuConnector
from .aliexpress import AliExpressConnector

CONNECTOR_MAP = {
    "temu": TemuConnector,
    "aliexpress": AliExpressConnector,
}


def get_connector(supplier_type: str) -> Optional[BaseConnector]:
    """
    공급처 타입에 맞는 커넥터 인스턴스 반환
    
    Args:
        supplier_type: 공급처 타입 문자열 (temu, aliexpress 등)
    
    Returns:
        BaseConnector 인스턴스 또는 None
    """
    connector_class = CONNECTOR_MAP.get(supplier_type.lower())
    if not connector_class:
        return None
    
    return connector_class()
