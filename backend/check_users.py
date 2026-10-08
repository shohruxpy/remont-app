import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from app.auth import get_password_hash, verify_password
from sqlalchemy.future import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.username}, hashed: {u.password_hash}, locked: {u.locked_until}, fails: {u.failed_attempts}")
            print("Verify admin password:", verify_password("admin", u.password_hash))

asyncio.run(main())
