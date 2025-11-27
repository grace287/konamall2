from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseConnector(ABC):
    """
    공급처 커넥터 기본 인터페이스.
    모든 공급처 커넥터는 이 클래스를 상속해야 함.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
    
    @abstractmethod
    def fetch_products(
        self,
        api_key: str = None,
        api_secret: str = None,
        config: Dict = None,
        limit: int = 100,
        category: str = None
    ) -> List[Dict]:
        """
        상품 목록 가져오기
        Returns: [{external_id, title, price, images, variants, ...}]
        """
        pass
    
    @abstractmethod
    def get_product(
        self,
        api_key: str,
        api_secret: str,
        external_id: str
    ) -> Optional[Dict]:
        """
        단일 상품 상세 정보
        """
        pass
    
    @abstractmethod
    def place_order(
        self,
        api_key: str,
        api_secret: str,
        order_data: Dict
    ) -> Dict:
        """
        외부 주문 생성
        Returns: {order_id, status, ...}
        """
        pass
    
    @abstractmethod
    def get_order_status(
        self,
        api_key: str,
        api_secret: str,
        order_id: str
    ) -> Dict:
        """
        주문 상태 조회
        Returns: {status, tracking_number, ...}
        """
        pass
    
    def get_tracking_info(
        self,
        tracking_number: str,
        courier: str = None
    ) -> Dict:
        """
        배송 추적 정보 조회
        Returns: {current_status, events: [{status, description, location, time}]}
        """
        return {
            "current_status": "in_transit",
            "events": []
        }
    
    def normalize_product(self, raw_data: Dict) -> Dict:
        """
        외부 데이터를 내부 형식으로 변환 (오버라이드 가능)
        """
        return raw_data
