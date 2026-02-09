"""Pytest fixtures for KonaMall backend."""
import os
import pytest
from fastapi.testclient import TestClient

# CI에서 사용하는 환경 변수와 동일하게 설정
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/konamall_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key")


@pytest.fixture
def client():
    """FastAPI TestClient. DB가 없어도 앱 임포트만 검증할 때 사용."""
    from app.main import app
    return TestClient(app)
