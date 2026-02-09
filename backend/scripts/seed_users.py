"""
테스트용 슈퍼관리자 + 일반 회원 계정 생성
사용법: backend 디렉터리에서
  python -m scripts.seed_users
  또는
  python scripts/seed_users.py
환경 변수 DATABASE_URL 이 필요합니다 (.env 또는 export).
"""
import os
import sys

# backend 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import User
from app.core.security import get_password_hash

# DB enum userrole은 소문자('admin', 'customer') — 모델 UserRole과 동일
ROLE_ADMIN = "admin"
ROLE_CUSTOMER = "customer"


# 기본 비밀번호 (개발/테스트용 — 운영에서는 절대 사용 금지)
DEFAULT_ADMIN_PASSWORD = "admin123!"
DEFAULT_TEST_PASSWORD = "test123!"


def seed_users():
    db = SessionLocal()
    try:
        # 1) 슈퍼관리자 (admin@konamall.local)
        admin_email = "admin@konamall.local"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash(DEFAULT_ADMIN_PASSWORD),
                name="슈퍼관리자",
                role=ROLE_ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[생성] 슈퍼관리자: {admin_email} / 비밀번호: {DEFAULT_ADMIN_PASSWORD}")
        else:
            admin.role = ROLE_ADMIN
            admin.is_active = True
            db.commit()
            print(f"[기존] 슈퍼관리자: {admin_email} (role=admin 유지)")

        # 2) 일반 테스트 회원 (test@konamall.local)
        test_email = "test@konamall.local"
        test_user = db.query(User).filter(User.email == test_email).first()
        if not test_user:
            test_user = User(
                email=test_email,
                hashed_password=get_password_hash(DEFAULT_TEST_PASSWORD),
                name="테스트유저",
                role=ROLE_CUSTOMER,
                is_active=True,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"[생성] 테스트 회원: {test_email} / 비밀번호: {DEFAULT_TEST_PASSWORD}")
        else:
            print(f"[기존] 테스트 회원: {test_email}")

        print("\n로그인 테스트:")
        print("  - 관리자 페이지: /admin → 위 슈퍼관리자로 로그인")
        print("  - 일반 로그인: /login → 위 테스트 회원 또는 회원가입으로 생성")
    except Exception as e:
        db.rollback()
        print(f"오류: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
