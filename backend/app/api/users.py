from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserOut, TokenWithUser, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=UserOut)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    회원가입
    
    - 이메일 중복 확인
    - 비밀번호 검증 (최소 8자)
    - 사용자 생성
    """
    # 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다"
        )
    
    # 비밀번호 검증
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 8자 이상이어야 합니다"
        )
    
    # 이름 검증
    if not user_data.name or len(user_data.name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이름을 올바르게 입력해주세요"
        )
    
    # 사용자 생성
    try:
        user = User(
            email=user_data.email.lower().strip(),  # 이메일 소문자 변환 및 공백 제거
            hashed_password=get_password_hash(user_data.password),
            name=user_data.name.strip(),
            phone=user_data.phone.strip() if user_data.phone else None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="회원가입 중 오류가 발생했습니다"
        )


@router.post("/login", response_model=TokenWithUser)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    로그인 (form: username=이메일, password=비밀번호)
    - 이메일과 비밀번호로 인증
    - JWT 토큰 및 사용자 정보 반환
    """
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다"
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다"
        )
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    user_out = UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_active=user.is_active,
        created_at=user.created_at,
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_out,
    }


@router.post("/login/json", response_model=TokenWithUser)
async def login_json(body: UserLogin, db: Session = Depends(get_db)):
    """로그인 (JSON body: email, password). SPA용."""
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="비활성화된 계정입니다")
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    user_out = UserOut(
        id=user.id, email=user.email, name=user.name, phone=user.phone,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_active=user.is_active, created_at=user.created_at,
    )
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user_out}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """현재 사용자 정보"""
    return current_user


@router.patch("/me")
async def update_me(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자 정보 수정"""
    if name:
        current_user.name = name
    if phone:
        current_user.phone = phone
    db.commit()
    return {"message": "Updated successfully"}
