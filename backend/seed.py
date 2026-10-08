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
        machine_data = [
            ("T-01", "90001", "Ремонт станка T-01 (CRX-82 / G-7887.001)", "CARP110303"),
            ("T-02", "90002", "Ремонт станка T-02 (CRX-82 / G-7403.001)", "CARP110303"),
            ("T-03", "90003", "Ремонт станка T-03 (CRX-82 / G-8115.001)", "CARP110304"),
            ("T-04", "90004", "Ремонт станка T-04 (Alpha-360 / 799.581)", "CARP110303"),
            ("T-05", "90005", "Ремонт станка T-05 (Alpha-400 / 799.980)", "CARP110303"),
            ("T-06", "90006", "Ремонт станка T-06 (CRX-82 / G-8427.001)", "CARP110302"),
            ("T-07", "90007", "Ремонт станка T-07 (Alpha-360 / 799.639)", "CARP110303"),
            ("T-08", "90008", "Ремонт станка T-08 (CRX-82 / G-8613.001)", "CARP110303"),
            ("T-09", "90009", "Ремонт станка T-09 (CRX-82 / G-9232.001)", "CARP110302"),
            ("T-10", "90010", "Ремонт станка T-10 (CRX-82 / G-9233.001)", "CARP110303"),
            ("T-11", "90011", "Ремонт станка T-11 (CRP-92 / G-9390.001)", "CARP110302"),
            ("T-12", "90012", "Ремонт станка T-12 (CRP-92 / G-9699.001)", "CARP110302"),
            ("T-13", "90013", "Ремонт станка T-13 (USP-93 / V-0088.001)", "CARP110301"),
            ("T-14", "90014", "Ремонт станка T-14 (CRP-92 / V-0210.001)", "CARP110303"),
            ("T-15", "90015", "Ремонт станка T-15 (CRP-92 / V-0543.001)", "CARP110304"),
            ("T-16", "90016", "Ремонт станка T-16 (CRP-93 / V-0702.001)", "CARP110303"),
            ("T-17", "90017", "Ремонт станка T-17 (CRP-92 / V-0703.001)", "CARP110303"),
            ("T-18", "90018", "Ремонт станка T-18 (Alpha-400 / 799.981)", "CARP110302"),
            ("T-19", "90019", "Ремонт станка T-19 (RCI-02 / V-1127.001)", "CARP110303"),
            ("T-20", "90020", "Ремонт станка T-20 (RCI-02 / V-1128.001)", "CARP110303"),
            ("T-21", "90021", "Ремонт станка T-21 (RCI-02 / V-1573.001)", "CARP110303"),
            ("T-22", "90022", "Ремонт станка T-22 (RCI-02 / V-1724.001)", "CARP110303"),
            ("T-23", "90023", "Ремонт станка T-23 (Alpha-400 / 800.049)", "CARP110302"),
            ("T-24", "90024", "Ремонт станка T-24 (HCI-X2 / V-2139.001)", "CARP110305"),
            ("T-25", "90025", "Ремонт станка T-25 (HCI-X2 / V-30003542)", "CARP110307"),
            ("T-26", "90026", "Ремонт станка T-26 (Alpha-500 / 795.054)", "CARP110304"),
            ("T-27", "90027", "Ремонт станка T-27 (HCI-X2 / V-3000605)", "CARP110307"),
            ("T-28", "90028", "Ремонт станка T-28 (RCI-02 / V-3000620)", "CARP110304"),
            ("T-29", "90384", "Ремонт станка T-29 (Van de Wiele)", "CARP110307"),
            ("T-30", "90362", "Ремонт станка T-30 (Van de Wiele)", "CARP110307"),
            ("T-31", "90361", "Ремонт станка T-31 (Van de Wiele)", "CARP110304"),
            ("T-32", "90363", "Ремонт станка T-32 (Schonher)", "CARP110304"),
            ("T-33", "90400", "Ремонт станка T-33 (Van de Wiele)", "CARP110304"),
            ("T-34", "90586", "Ремонт станка T-34 (Van de Wiele)", "CARP110300"),
            ("T-35", "90587", "Ремонт станка T-35 (Van de Wiele)", "CARP110305")
        ]
        machines = [
            Machine(
                code=code,
                name=name,
                sap_co_order=co,
                sap_cost_center=cc,
                created_by=admin.id
            )
            for code, co, name, cc in machine_data
        ]
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
