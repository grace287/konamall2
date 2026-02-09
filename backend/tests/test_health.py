"""헬스 체크 및 앱 로드 검증."""
import pytest


def test_health_endpoint(client):
    """GET /health returns 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"


def test_root(client):
    """GET / returns API 메시지."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
