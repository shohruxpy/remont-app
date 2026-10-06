import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_machine_admin(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.post("/api/v1/machines/", json={"code": "EQ:LOOM-999", "name": "Test Loom"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["code"] == "EQ:LOOM-999"

@pytest.mark.asyncio
async def test_create_machine_user(client: AsyncClient, user_token: str):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.post("/api/v1/machines/", json={"code": "EQ:LOOM-888", "name": "User Loom"}, headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_machines(client: AsyncClient, user_token: str):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.get("/api/v1/machines/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
