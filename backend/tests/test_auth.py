import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", data={"username": "admin", "password": "admin"})
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_login_fail(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", data={"username": "admin", "password": "wrong"})
    assert response.status_code == 400
