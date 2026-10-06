from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Union
import uuid

from ..database import get_db
from ..models import Repair, RepairItem, Material, User, AuditLog
from ..schemas_extended import RepairCreate, RepairOutAdmin, RepairOutUser
from ..auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Union[RepairOutAdmin, RepairOutUser])
async def create_repair(repair: RepairCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_repair = Repair(
        machine_id=repair.machine_id,
        repair_date=repair.repair_date,
        type=repair.type,
        title=repair.title,
        description=repair.description,
        crew=repair.crew,
        zaprafka_id=repair.zaprafka_id,
        plan_id=repair.plan_id,
        created_by=current_user.id
    )
    db.add(db_repair)
    await db.flush()

    for item in repair.items:
        unit_price = None
        if item.material_id:
            res = await db.execute(select(Material).where(Material.id == item.material_id))
            mat = res.scalars().first()
            if mat:
                unit_price = mat.map_price
        
        amount = None
        if unit_price is not None and item.qty:
            amount = float(unit_price) * float(item.qty)
            
        db_item = RepairItem(
            repair_id=db_repair.id,
            item_no=item.item_no,
            material_id=item.material_id,
            free_text_material=item.free_text_material,
            condition=item.condition,
            qty=item.qty,
            unit=item.unit,
            note=item.note,
            unit_price=unit_price,
            amount=amount,
            created_by=current_user.id
        )
        db.add(db_item)
    
    log = AuditLog(user_id=current_user.id, action="CREATE", entity="REPAIR", entity_id=db_repair.id)
    db.add(log)
    await db.commit()
    await db.refresh(db_repair)
    
    # Reload with items
    res = await db.execute(select(Repair).options(selectinload(Repair.items)).where(Repair.id == db_repair.id))
    loaded = res.scalars().first()
    
    if current_user.role == "ADMIN":
        return RepairOutAdmin.model_validate(loaded)
    return RepairOutUser.model_validate(loaded)

@router.get("/{repair_id}", response_model=Union[RepairOutAdmin, RepairOutUser])
async def get_repair(repair_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Repair).options(selectinload(Repair.items)).where(Repair.id == repair_id))
    loaded = res.scalars().first()
    if not loaded:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user.role == "ADMIN":
        return RepairOutAdmin.model_validate(loaded)
    return RepairOutUser.model_validate(loaded)
