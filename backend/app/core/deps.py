"""
Authentication & Authorization Dependencies
인증 및 권한 관리 의존성
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List, Callable
from functools import wraps
import time
import hashlib
from collections import defaultdict
import asyncio

from app.db.session import get_db
from app.db.models import User, UserRole
from app.core.security import verify_token
from app.core.config import settings

# HTTP Bearer 스키마
security = HTTPBearer(auto_error=False)


class AuthenticationError(HTTPException):
    """인증 오류"""
    def __init__(self, detail: str = "인증에 실패했습니다"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class PermissionDeniedError(HTTPException):
    """권한 오류"""
    def __init__(self, detail: str = "권한이 없습니다"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class RateLimitExceededError(HTTPException):
    """Rate Limit 초과"""
    def __init__(self, detail: str = "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail
        )


# Rate Limiting 저장소 (실제 운영에서는 Redis 사용 권장)
class RateLimiter:
    """
    IP 및 사용자 기반 Rate Limiting
    """
    def __init__(self):
        self.requests: dict = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def is_allowed(
        self,
        key: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> bool:
        """요청 허용 여부 확인"""
        async with self._lock:
            now = time.time()
            # 오래된 요청 제거
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if now - req_time < window_seconds
            ]
            
            if len(self.requests[key]) >= max_requests:
                return False
            
            self.requests[key].append(now)
            return True
    
    async def get_remaining(self, key: str, max_requests: int = 100, window_seconds: int = 60) -> int:
        """남은 요청 수"""
        now = time.time()
        valid_requests = [
            req_time for req_time in self.requests.get(key, [])
            if now - req_time < window_seconds
        ]
        return max(0, max_requests - len(valid_requests))


# 전역 Rate Limiter 인스턴스
rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """클라이언트 IP 추출"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitDep:
    """
    Rate Limiting 의존성
    
    사용법:
        @router.get("/api/resource")
        async def get_resource(
            _: None = Depends(RateLimitDep(max_requests=10, window_seconds=60))
        ):
            ...
    """
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    async def __call__(self, request: Request):
        client_ip = get_client_ip(request)
        key = f"rate_limit:{client_ip}"
        
        if not await rate_limiter.is_allowed(key, self.max_requests, self.window_seconds):
            raise RateLimitExceededError()
        
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    현재 인증된 사용자를 가져옴
    
    - JWT 토큰 검증
    - 사용자 존재 및 활성화 상태 확인
    """
    if not credentials:
        raise AuthenticationError("인증 토큰이 필요합니다")
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise AuthenticationError("유효하지 않거나 만료된 토큰입니다")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("토큰에 사용자 정보가 없습니다")
    
    try:
        user_id = int(user_id)
    except ValueError:
        raise AuthenticationError("잘못된 토큰 형식입니다")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise AuthenticationError("사용자를 찾을 수 없습니다")
    
    if not user.is_active:
        raise AuthenticationError("비활성화된 계정입니다")
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    인증된 사용자를 가져오되, 없으면 None 반환 (선택적 인증)
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """활성화된 사용자만 허용"""
    if not current_user.is_active:
        raise AuthenticationError("비활성화된 계정입니다")
    return current_user


async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """관리자 권한 확인"""
    if current_user.role != UserRole.ADMIN:
        raise PermissionDeniedError("관리자 권한이 필요합니다")
    return current_user


async def get_seller_or_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """판매자 또는 관리자 권한 확인"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SELLER]:
        raise PermissionDeniedError("판매자 또는 관리자 권한이 필요합니다")
    return current_user


class RoleChecker:
    """
    역할 기반 권한 검사 클래스
    
    사용법:
        @router.get("/admin-only")
        async def admin_only(user: User = Depends(RoleChecker([UserRole.ADMIN]))):
            ...
    """
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in self.allowed_roles:
            raise PermissionDeniedError(
                f"이 작업은 {', '.join(r.value for r in self.allowed_roles)} 권한이 필요합니다"
            )
        return current_user


# 권한 체커 인스턴스
require_admin = RoleChecker([UserRole.ADMIN])
require_seller = RoleChecker([UserRole.SELLER, UserRole.ADMIN])
require_user = RoleChecker([UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN])


class APIKeyAuth:
    """
    API 키 기반 인증 (외부 서비스 연동용)
    
    사용법:
        @router.get("/api/webhook")
        async def webhook(api_key: str = Depends(APIKeyAuth())):
            ...
    """
    def __init__(self, header_name: str = "X-API-Key"):
        self.header_name = header_name
    
    async def __call__(self, request: Request):
        api_key = request.headers.get(self.header_name)
        if not api_key:
            raise AuthenticationError("API 키가 필요합니다")
        
        # 설정된 API 키와 비교 (실제 운영에서는 DB 조회)
        valid_keys = getattr(settings, 'VALID_API_KEYS', [])
        if api_key not in valid_keys:
            raise AuthenticationError("유효하지 않은 API 키입니다")
        
        return api_key


class ResourceOwnerChecker:
    """
    리소스 소유자 확인 (본인 또는 관리자만 접근 가능)
    
    사용법:
        async def get_order(
            order_id: int,
            user: User = Depends(get_current_user),
            db: Session = Depends(get_db)
        ):
            order = db.query(Order).filter(Order.id == order_id).first()
            ResourceOwnerChecker.check(order, user)
            return order
    """
    @staticmethod
    def check(resource, user: User, owner_field: str = "user_id"):
        """리소스 소유자 확인"""
        if not resource:
            raise HTTPException(status_code=404, detail="리소스를 찾을 수 없습니다")
        
        resource_owner_id = getattr(resource, owner_field, None)
        
        # 관리자는 모든 리소스 접근 가능
        if user.role == UserRole.ADMIN:
            return True
        
        # 본인 리소스만 접근 가능
        if resource_owner_id != user.id:
            raise PermissionDeniedError("이 리소스에 접근할 권한이 없습니다")
        
        return True


# 토큰 블랙리스트 (로그아웃 처리용)
# 실제 운영에서는 Redis 사용 권장
token_blacklist: set = set()


def blacklist_token(token: str):
    """토큰 블랙리스트에 추가 (로그아웃)"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    token_blacklist.add(token_hash)


def is_token_blacklisted(token: str) -> bool:
    """토큰 블랙리스트 확인"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token_hash in token_blacklist


async def get_current_user_with_blacklist_check(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    블랙리스트 체크가 포함된 사용자 인증
    """
    if not credentials:
        raise AuthenticationError("인증 토큰이 필요합니다")
    
    token = credentials.credentials
    
    # 블랙리스트 체크
    if is_token_blacklisted(token):
        raise AuthenticationError("이미 로그아웃된 토큰입니다")
    
    return await get_current_user(credentials, db)
