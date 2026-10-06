from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..models import AuditLog, User
from ..auth import admin_required

router = APIRouter()

@router.get("/")
async def get_audit_log(
    date: Optional[datetime] = None,
    username: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    query = select(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id)
    if date:
        query = query.where(func.date(AuditLog.at) == date.date())
    if username:
        query = query.where(User.username.ilike(f"%{username}%"))
        
    query = query.order_by(AuditLog.at.desc()).offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(query)
    
    results = []
    for log, user in res.all():
        results.append({
            "id": log.id,
            "at": log.at,
            "username": user.username if user else "System",
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "before": log.before,
            "after": log.after
        })
    return results
