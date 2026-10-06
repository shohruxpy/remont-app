import pytest
from httpx import AsyncClient
from datetime import datetime

@pytest.mark.asyncio
async def test_zaprafka_flow(client: AsyncClient, admin_token: str, user_token: str):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_user = {"Authorization": f"Bearer {user_token}"}
    
    # 1. Create a machine
    res = await client.post("/api/v1/machines/", json={"code": "EQ:LOOM-Z1", "name": "Loom Z1", "zaprafka_interval_months": 60}, headers=headers_admin)
    assert res.status_code == 200
    machine_id = res.json()["id"]
    
    # 2. Start zaprafka
    res = await client.post("/api/v1/zaprafka/start", json={"machine_id": machine_id, "start_date": "2026-10-01T00:00:00Z"}, headers=headers_admin)
    assert res.status_code == 200
    zaprafka_id = res.json()["id"]
    
    # 3. Add repair with a material
    repair_data = {
        "machine_id": machine_id,
        "repair_date": "2026-10-02T00:00:00Z",
        "type": "ZAPRAFKA_WORK",
        "zaprafka_id": zaprafka_id,
        "items": [
            {
                "item_no": 1,
                "condition": "NEW",
                "qty": 2.5,
                "free_text_material": "Custom Bolt"
            }
        ]
    }
    
    # User creates repair
    res = await client.post("/api/v1/repairs/", json=repair_data, headers=headers_user)
    assert res.status_code == 200
    user_repair = res.json()
    # Check that amount is NOT in user response
    assert "amount" not in user_repair["items"][0]
    
    # Admin gets repair
    res = await client.get(f"/api/v1/repairs/{user_repair['id']}", headers=headers_admin)
    admin_repair = res.json()
    assert "amount" in admin_repair["items"][0]
    
    # 4. Finish zaprafka
    res = await client.post(f"/api/v1/zaprafka/{zaprafka_id}/finish", headers=headers_admin)
    assert res.status_code == 200
    
    # 5. Check machine last zaprafka date is set
    res = await client.get(f"/api/v1/machines/EQ:LOOM-Z1", headers=headers_admin)
    assert res.status_code == 200
    m = res.json()
    assert m["last_zaprafka_end"] is not None
    assert m["status"] == "ACTIVE"
