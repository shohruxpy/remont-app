import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base, AsyncSessionLocal
from app.models import User
from app.auth import get_password_hash

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        admin = User(username="admin", full_name="Admin", role="ADMIN", password_hash=get_password_hash("admin"))
        user = User(username="user", full_name="User", role="USER", password_hash=get_password_hash("user"))
        session.add(admin)
        session.add(user)
        await session.commit()
    
    yield
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def admin_token(client):
    response = await client.post("/api/v1/auth/login", data={"username": "admin", "password": "admin"})
    return response.json()["access_token"]

@pytest.fixture
async def user_token(client):
    response = await client.post("/api/v1/auth/login", data={"username": "user", "password": "user"})
    return response.json()["access_token"]
