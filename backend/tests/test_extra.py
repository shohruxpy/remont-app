import pytest
from httpx import AsyncClient
import io

@pytest.mark.asyncio
async def test_analytics_history(client, admin_token):
    response = await client.get("/api/v1/analytics/history", headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    data = response.json()
    assert "repairs_count" in data

@pytest.mark.asyncio
async def test_analytics_dashboard(client, admin_token):
    response = await client.get("/api/v1/analytics/dashboard", headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data

@pytest.mark.asyncio
async def test_import_machines(client, admin_token):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Код", "Название", "CO", "МВЗ"])
    ws.append(["TEST-01", "Test Machine", "123", "456"])
    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    
    files = {"file": ("test.xlsx", out, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    response = await client.post("/api/v1/machines/import", files=files, headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    data = response.json()
    assert "Added TEST-01" in data["results"][0]

@pytest.mark.asyncio
async def test_qr_sheet(client, admin_token):
    response = await client.post("/api/v1/machines/qr-sheet", json={"codes": ["TEST-01"]}, headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

@pytest.mark.asyncio
async def test_audit_log(client, admin_token, user_token):
    response = await client.get("/api/v1/audit-log/", headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    
    # user should get 403
    response_user = await client.get("/api/v1/audit-log/", headers={'Authorization': f'Bearer {user_token}'})
    assert response_user.status_code == 403

@pytest.mark.asyncio
async def test_reports(client, admin_token, user_token):
    response = await client.get("/api/v1/reports/repair-history.xlsx", headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    response_user = await client.get("/api/v1/reports/repair-history.xlsx", headers={'Authorization': f'Bearer {user_token}'})
    assert response_user.status_code == 403

@pytest.mark.asyncio
async def test_templates_copy_patch(client, admin_token):
    # create template first
    resp = await client.post("/api/v1/templates/", json={"name": "Test Tpl", "type": "REPAIR", "items": []}, headers={'Authorization': f'Bearer {admin_token}'})
    assert resp.status_code == 200
    tpl_id = resp.json()["id"]
    
    # copy
    resp_copy = await client.post(f"/api/v1/templates/{tpl_id}/copy", headers={'Authorization': f'Bearer {admin_token}'})
    assert resp_copy.status_code == 200
    assert resp_copy.json()["name"] == "Test Tpl (Копия)"
    
    # patch
    resp_patch = await client.patch(f"/api/v1/templates/{tpl_id}", json={"active": False}, headers={'Authorization': f'Bearer {admin_token}'})
    assert resp_patch.status_code == 200
    assert resp_patch.json()["is_active"] == False

@pytest.mark.asyncio
async def test_users_patch_reset(client, admin_token):
    # create user
    resp = await client.post("/api/v1/users/", json={"username": "user2", "full_name": "User 2", "role": "USER", "password": "123"}, headers={'Authorization': f'Bearer {admin_token}'})
    assert resp.status_code == 200
    user_id = resp.json()["id"]
    
    # patch
    resp_patch = await client.patch(f"/api/v1/users/{user_id}", json={"full_name": "User 2 patched"}, headers={'Authorization': f'Bearer {admin_token}'})
    assert resp_patch.status_code == 200
    assert resp_patch.json()["full_name"] == "User 2 patched"
    
    # reset
    resp_reset = await client.post(f"/api/v1/users/{user_id}/reset-password", headers={'Authorization': f'Bearer {admin_token}'})
    assert resp_reset.status_code == 200
    assert "temporary_password" in resp_reset.json()

@pytest.mark.asyncio
async def test_analytics_amount_visibility(client, admin_token, user_token):
    resp_admin = await client.get("/api/v1/analytics/history", headers={'Authorization': f'Bearer {admin_token}'})
    assert resp_admin.status_code == 200
    assert "new_parts_amount" in resp_admin.json()
    assert resp_admin.json()["new_parts_amount"] is not None or resp_admin.json()["new_parts_amount"] == 0
    
    resp_user = await client.get("/api/v1/analytics/history", headers={'Authorization': f'Bearer {user_token}'})
    assert resp_user.status_code == 200
    assert resp_user.json()["new_parts_amount"] is None

