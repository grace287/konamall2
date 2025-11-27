from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "KonaMall"
    DEBUG: bool = True
    BASE_URL: str = "http://localhost:3000"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/konamall"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Exchange Rate
    DEFAULT_EXCHANGE_RATE: float = 1350.0  # USD to KRW
    
    # Pricing
    DEFAULT_MARGIN_PERCENT: float = 30.0
    FREE_SHIPPING_THRESHOLD_KRW: int = 50000
    DEFAULT_SHIPPING_COST_KRW: int = 3000
    
    # KakaoPay
    KAKAO_PAY_ADMIN_KEY: Optional[str] = None
    KAKAO_PAY_CID: str = "TC0ONETIME"  # 테스트용 CID
    
    # NaverPay
    NAVER_PAY_CLIENT_ID: Optional[str] = None
    NAVER_PAY_CLIENT_SECRET: Optional[str] = None
    NAVER_PAY_CHAIN_ID: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
