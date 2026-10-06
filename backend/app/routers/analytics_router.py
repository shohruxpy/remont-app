from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from ..database import get_db
from ..models import Repair, RepairItem, Zaprafka, Machine, User, Role
from ..auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class AnalyticsHistoryOut(BaseModel):
    repairs_count: int
    new_parts_qty: float
    new_parts_amount: Optional[float]
    refurbished_parts_qty: float
    top_parts: List[dict]
    refurbishment_share_pct: float
    zaprafka_expenses: Optional[float]

@router.get("/history", response_model=AnalyticsHistoryOut)
async def get_analytics_history(
    machine_code: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Repair)
    if machine_code:
        m_res = await db.execute(select(Machine).where(Machine.code == machine_code))
        m = m_res.scalars().first()
        if m:
            query = query.where(Repair.machine_id == m.id)
    if date_from:
        query = query.where(Repair.repair_date >= date_from)
    if date_to:
        query = query.where(Repair.repair_date <= date_to)
        
    res = await db.execute(query)
    repairs = res.scalars().all()
    
    repairs_count = len(repairs)
    new_parts_qty = 0.0
    new_parts_amount = 0.0
    refurb_parts_qty = 0.0
    zapr_exp = 0.0
    
    for r in repairs:
        items_res = await db.execute(select(RepairItem).where(RepairItem.repair_id == r.id))
        items = items_res.scalars().all()
        for i in items:
            q = float(i.qty)
            a = float(i.amount) if i.amount else 0.0
            if i.condition == "NEW":
                new_parts_qty += q
                new_parts_amount += a
                if r.type == "ZAPRAFKA_WORK":
                    zapr_exp += a
            else:
                refurb_parts_qty += q
                
    total_parts = new_parts_qty + refurb_parts_qty
    pct = (refurb_parts_qty / total_parts * 100) if total_parts > 0 else 0.0
    
    return AnalyticsHistoryOut(
        repairs_count=repairs_count,
        new_parts_qty=new_parts_qty,
        new_parts_amount=new_parts_amount if current_user.role == Role.ADMIN.value else None,
        refurbished_parts_qty=refurb_parts_qty,
        top_parts=[],
        refurbishment_share_pct=pct,
        zaprafka_expenses=zapr_exp if current_user.role == Role.ADMIN.value else None
    )

@router.get("/dashboard")
async def get_analytics_dashboard(
    machine_code: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Repair)
    if machine_code:
        m_res = await db.execute(select(Machine).where(Machine.code == machine_code))
        m = m_res.scalars().first()
        if m:
            query = query.where(Repair.machine_id == m.id)
    if date_from:
        query = query.where(Repair.repair_date >= date_from)
    if date_to:
        query = query.where(Repair.repair_date <= date_to)
        
    res = await db.execute(query)
    repairs = res.scalars().all()
    
    amt = 0.0
    for r in repairs:
        items_res = await db.execute(select(RepairItem).where(RepairItem.repair_id == r.id))
        for i in items_res.scalars().all():
            if i.amount: amt += float(i.amount)

    zapr_in_progress = 0
    if not machine_code:
        z_res = await db.execute(select(Zaprafka).where(Zaprafka.status == "IN_PROGRESS"))
        zapr_in_progress = len(z_res.scalars().all())

    return {
        "kpis": {"repairs": len(repairs), "amount": amt, "zapr_in_progress": zapr_in_progress, "overdue": 0},
        "monthly_expenses": [{"month": "Текущий", "amount": amt}],
        "new_vs_refurbished": {"new_pct": 50, "refurbished_pct": 50},
        "top_parts": [],
        "zaprafka_deadlines": []
    }
