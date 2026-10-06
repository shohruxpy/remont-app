from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import uuid
from datetime import datetime

from ..database import get_db
from ..models import Template, TemplateItem, User, Role
from ..schemas_extended import TemplateOut, TemplateCreate, TemplateItemCreate
from ..auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TemplateOut])
async def get_templates(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Template).where(Template.is_archived == False))
    return res.scalars().all()

@router.post("/", response_model=TemplateOut)
async def create_template(
    template: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
        
    db_tpl = Template(
        name=template.name,
        type=template.type,
        created_by=current_user.id
    )
    db.add(db_tpl)
    await db.flush()
    
    for idx, item in enumerate(template.items):
        db_item = TemplateItem(
            template_id=db_tpl.id,
            item_no=idx + 1,
            material_id=item.material_id,
            condition=item.condition,
            qty=item.qty,
            unit=item.unit,
            note=item.note
        )
        db.add(db_item)
        
    await db.commit()
    await db.refresh(db_tpl)
    return db_tpl

@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(template_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Template).where(Template.id == template_id))
    tpl = res.scalars().first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Not found")
    return tpl

from pydantic import BaseModel
class TemplatePatch(BaseModel):
    active: bool

@router.post("/{template_id}/copy", response_model=TemplateOut)
async def copy_template(template_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
        
    res = await db.execute(select(Template).where(Template.id == template_id))
    tpl = res.scalars().first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Not found")
        
    db_tpl = Template(
        name=tpl.name + " (Копия)",
        type=tpl.type,
        created_by=current_user.id
    )
    db.add(db_tpl)
    await db.flush()
    
    items_res = await db.execute(select(TemplateItem).where(TemplateItem.template_id == template_id))
    for item in items_res.scalars().all():
        db_item = TemplateItem(
            template_id=db_tpl.id,
            item_no=item.item_no,
            material_id=item.material_id,
            condition=item.condition,
            qty=item.qty,
            unit=item.unit,
            note=item.note
        )
        db.add(db_item)
        
    await db.commit()
    await db.refresh(db_tpl)
    return db_tpl

@router.patch("/{template_id}", response_model=TemplateOut)
async def patch_template(template_id: uuid.UUID, req: TemplatePatch, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
        
    res = await db.execute(select(Template).where(Template.id == template_id))
    tpl = res.scalars().first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Not found")
        
    tpl.is_active = req.active
    await db.commit()
    await db.refresh(tpl)
    return tpl
