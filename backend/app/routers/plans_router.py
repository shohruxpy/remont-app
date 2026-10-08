from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import uuid
from datetime import datetime

from ..database import get_db
from ..models import Plan, User, PlanStatus
from ..schemas_extended import PlanOut, PlanCreate
from ..auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[PlanOut])
async def get_plans(
    machine_code: Optional[str] = None, 
    date_from: Optional[datetime] = None, 
    date_to: Optional[datetime] = None, 
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Plan).where(Plan.is_archived == False)
    # Filter by machine code would require joining Machine, simplifying for now
    if status:
        query = query.where(Plan.status == status)
    
    res = await db.execute(query)
    plans = res.scalars().all()
    return plans

@router.post("/", response_model=PlanOut)
async def create_plan(
    plan: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p_date = plan.plan_date.replace(tzinfo=None) if plan.plan_date and plan.plan_date.tzinfo else plan.plan_date
    db_plan = Plan(
        machine_id=plan.machine_id,
        type=plan.type,
        plan_date=p_date,
        description=plan.description,
        created_by=current_user.id
    )
    db.add(db_plan)
    await db.commit()
    await db.refresh(db_plan)
    return db_plan

@router.put("/{plan_id}", response_model=PlanOut)
async def update_plan(
    plan_id: uuid.UUID,
    plan_data: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Plan).where(Plan.id == plan_id, Plan.is_archived == False))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Not found")
    
    plan.type = plan_data.type
    plan.plan_date = plan_data.plan_date.replace(tzinfo=None) if plan_data.plan_date and plan_data.plan_date.tzinfo else plan_data.plan_date
    plan.description = plan_data.description
    plan.version += 1
    plan.updated_by = current_user.id
    plan.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(plan)
    return plan

@router.post("/{plan_id}/complete", response_model=PlanOut)
async def complete_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Not found")
    
    plan.status = PlanStatus.DONE.value
    plan.updated_by = current_user.id
    plan.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(plan)
    return plan

@router.delete("/{plan_id}")
async def delete_plan(plan_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(plan)
    await db.commit()
    return {"status": "success", "message": "Plan deleted"}

