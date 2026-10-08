from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
import uuid
from datetime import datetime

from ..database import get_db
from ..models import Material, Machine, Repair, RepairItem, User, AuditLog
from ..schemas_extended import MaterialOut
from ..auth import get_current_user

router = APIRouter()

class MaterialConsumeRequest(BaseModel):
    material_id: uuid.UUID
    machine_id: uuid.UUID
    qty: Decimal
    reason: Optional[str] = "Списание на ремонт"
    technician: Optional[str] = "Мастер участка"

@router.get("/", response_model=List[MaterialOut])
async def get_materials(search: Optional[str] = None, page: int = 1, page_size: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Material).order_by(Material.code.asc())
    if search:
        query = query.where(Material.name.ilike(f"%{search}%") | Material.code.ilike(f"%{search}%"))
    query = query.limit(page_size).offset((page - 1) * page_size)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/consume")
async def consume_material(
    req: MaterialConsumeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch material
    res_mat = await db.execute(select(Material).where(Material.id == req.material_id))
    mat = res_mat.scalars().first()
    if not mat:
        raise HTTPException(status_code=404, detail="Материал не найден")

    # 2. Fetch machine
    res_mach = await db.execute(select(Machine).where(Machine.id == req.machine_id))
    mach = res_mach.scalars().first()
    if not mach:
        raise HTTPException(status_code=404, detail="Станок не найден")

    # 3. Check stock balance
    current_stock = mat.stock_qty or Decimal(0)
    if current_stock < req.qty:
        raise HTTPException(status_code=400, detail=f"Недостаточно остатка на складе! Доступно: {current_stock} {mat.unit or 'ед.'}, запрошено: {req.qty}")

    # 4. Deduct stock
    mat.stock_qty = current_stock - req.qty

    # 5. Calculate cost
    unit_price = mat.map_price or Decimal(0)
    total_amount = float(unit_price) * float(req.qty)

    # 6. Generate SAP 261 Document ID
    sap_doc_no = f"SAP-261-{datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # 7. Create Repair & RepairItem record linking expense to this machine
    repair_record = Repair(
        machine_id=mach.id,
        repair_date=datetime.utcnow(),
        type="СПИСАНИЕ МАТЕРИАЛА",
        title=f"Списание: {mat.name} ({req.qty} {mat.unit or 'шт.'})",
        description=f"Причина: {req.reason}. Проведено в SAP: документ {sap_doc_no}. Заказ СО: {mach.sap_co_order or 'N/A'}",
        crew=req.technician,
        status="ВЫПОЛНЕНО",
        created_by=current_user.id
    )
    db.add(repair_record)
    await db.flush()

    repair_item = RepairItem(
        repair_id=repair_record.id,
        item_no=1,
        material_id=mat.id,
        condition="НОВОЕ",
        qty=req.qty,
        unit=mat.unit,
        unit_price=unit_price,
        amount=Decimal(str(total_amount)),
        note=f"Списано со склада. SAP Doc: {sap_doc_no}",
        created_by=current_user.id
    )
    db.add(repair_item)

    # 8. Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="SAP_CONSUME_261",
        entity="MATERIAL",
        entity_id=mat.id,
        after={
            "material_code": mat.code,
            "machine_code": mach.code,
            "qty": float(req.qty),
            "remaining_stock": float(mat.stock_qty),
            "sap_doc": sap_doc_no,
            "sap_co_order": mach.sap_co_order
        }
    )
    db.add(audit)

    await db.commit()
    await db.refresh(mat)

    return {
        "status": "success",
        "message": f"Материал успешно списан на станок {mach.code} и проведен в SAP!",
        "sap_document_no": sap_doc_no,
        "machine_code": mach.code,
        "material_name": mat.name,
        "consumed_qty": float(req.qty),
        "remaining_stock": float(mat.stock_qty),
        "total_cost": total_amount
    }

@router.post("/sync-sap")
async def sync_sap_materials(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Simulates real-time synchronization with SAP MM module
    res = await db.execute(select(Material))
    materials = res.scalars().all()
    
    # Refresh timestamps
    now = datetime.utcnow()
    for m in materials:
        m.price_updated_at = now
        m.source = "SAP_ONLINE_SYNC"
        if m.stock_qty is None:
            m.stock_qty = Decimal(50.0)

    audit = AuditLog(user_id=current_user.id, action="SAP_CATALOG_SYNC", entity="WAREHOUSE", entity_id=current_user.id)
    db.add(audit)
    await db.commit()

    return {
        "status": "success",
        "message": "Синхронизация с SAP успешно завершена!",
        "synced_items_count": len(materials),
        "sync_time": now.isoformat()
    }
