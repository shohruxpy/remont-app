from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from ..database import get_db
from ..models import Material, User
from ..schemas_extended import MaterialOut
from ..auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[MaterialOut])
async def get_materials(search: Optional[str] = None, page: int = 1, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Material)
    if search:
        query = query.where(Material.name.ilike(f"%{search}%") | Material.code.ilike(f"%{search}%"))
    query = query.limit(50).offset((page - 1) * 50)
    result = await db.execute(query)
    return result.scalars().all()
