import asyncio
import uuid
from app.database import AsyncSessionLocal, engine, Base
from app.models import User, Machine, Material, Role, MachineStatus, Condition
from app.auth import get_password_hash
from sqlalchemy.future import select
from sqlalchemy import func

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if admin already exists
        result = await session.execute(select(func.count(User.id)))
        count = result.scalar()
        if count > 0:
            print("Database already seeded.")
            return

        print("Seeding database...")
        # Users
        admin = User(
            username="admin", 
            full_name="Администратор", 
            role=Role.ADMIN.value, 
            password_hash=get_password_hash("admin")
        )
        user1 = User(
            username="user1", 
            full_name="Пользователь 1", 
            role=Role.USER.value, 
            password_hash=get_password_hash("user1")
        )
        session.add_all([admin, user1])
        await session.flush()
        
        # Machines
        machines = [
            Machine(code="EQ:LOOM-001", name="Станок ткацкий Alpha", location="Цех 1", sap_co_order="CO100", sap_cost_center="CC100"),
            Machine(code="EQ:LOOM-002", name="Станок ткацкий Beta", location="Цех 1", sap_co_order="CO101", sap_cost_center="CC100"),
            Machine(code="EQ:LOOM-003", name="Станок ткацкий Gamma", location="Цех 2", sap_co_order="CO102", sap_cost_center="CC100"),
            Machine(code="EQ:LOOM-004", name="Станок крутильный Delta", location="Цех 3", sap_co_order="CO103", sap_cost_center="CC100"),
            Machine(code="EQ:LOOM-005", name="Станок сновальный Epsilon", location="Цех 3", sap_co_order="CO104", sap_cost_center="CC100"),
        ]
        for m in machines:
            m.created_by = admin.id
        session.add_all(machines)
        
        # Materials
        materials = [
            Material(code=f"MAT-00{i}", name=f"Деталь {i}", unit="шт", map_price=i * 1500.0) for i in range(1, 31)
        ]
        session.add_all(materials)
        
        await session.commit()
        print("Seeding finished successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
