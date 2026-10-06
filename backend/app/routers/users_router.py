from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from ..models import User, AuditLog
from ..schemas import UserOut, UserCreate
from ..auth import get_current_user, admin_required, get_password_hash

router = APIRouter()

@router.get("/", response_model=List[UserOut])
async def read_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(admin_required)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("/", response_model=UserOut)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(admin_required)):
    result = await db.execute(select(User).where(User.username == user.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        password_hash=hashed,
        created_by=current_user.id
    )
    db.add(db_user)
    await db.flush()
    
    log = AuditLog(user_id=current_user.id, action="CREATE", entity="USER", entity_id=db_user.id)
    db.add(log)
    await db.commit()
    await db.refresh(db_user)
    return db_user

from pydantic import BaseModel
from typing import Optional
import uuid

class UserUpdate(BaseModel):
    active: Optional[bool] = None
    role: Optional[str] = None
    full_name: Optional[str] = None

@router.patch("/{id}", response_model=UserOut)
async def update_user(id: uuid.UUID, user_update: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(admin_required)):
    result = await db.execute(select(User).where(User.id == id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.active is not None:
        db_user.is_active = user_update.active
    if user_update.role is not None:
        db_user.role = user_update.role
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
        
    log = AuditLog(user_id=current_user.id, action="UPDATE", entity="USER", entity_id=db_user.id)
    db.add(log)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.post("/{id}/reset-password")
async def reset_password(id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(admin_required)):
    import secrets
    result = await db.execute(select(User).where(User.id == id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    temp_pwd = secrets.token_urlsafe(8)
    db_user.password_hash = get_password_hash(temp_pwd)
    
    log = AuditLog(user_id=current_user.id, action="RESET_PASSWORD", entity="USER", entity_id=db_user.id)
    db.add(log)
    await db.commit()
    
    return {"temporary_password": temp_pwd}
