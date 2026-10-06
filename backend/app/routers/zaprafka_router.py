from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from dateutil.relativedelta import relativedelta
import uuid

from ..database import get_db
from ..models import Zaprafka, Machine, User, AuditLog, ZaprafkaStatus, MachineStatus
from ..schemas_extended import ZaprafkaOut, ZaprafkaCreate
from ..auth import get_current_user

router = APIRouter()

@router.post("/start", response_model=ZaprafkaOut)
async def start_zaprafka(zaprafka: ZaprafkaCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if machine already has an active zaprafka
    res = await db.execute(select(Zaprafka).where(Zaprafka.machine_id == zaprafka.machine_id, Zaprafka.status == ZaprafkaStatus.IN_PROGRESS.value))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Machine already has an active zaprafka")

    db_zap = Zaprafka(
        machine_id=zaprafka.machine_id,
        start_date=zaprafka.start_date,
        status=ZaprafkaStatus.IN_PROGRESS.value,
        template_id=zaprafka.template_id,
        note=zaprafka.note,
        created_by=current_user.id
    )
    db.add(db_zap)
    
    # Update machine status
    m_res = await db.execute(select(Machine).where(Machine.id == zaprafka.machine_id))
    machine = m_res.scalars().first()
    if machine:
        machine.status = MachineStatus.IN_ZAPRAFKA.value
        
    await db.commit()
    await db.refresh(db_zap)
    return db_zap

@router.post("/{zaprafka_id}/finish", response_model=ZaprafkaOut)
async def finish_zaprafka(zaprafka_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Zaprafka).where(Zaprafka.id == zaprafka_id))
    zap = res.scalars().first()
    if not zap:
        raise HTTPException(status_code=404, detail="Not found")
    
    zap.status = ZaprafkaStatus.DONE.value
    zap.end_date = datetime.utcnow()
    
    # Update machine next zaprafka date
    m_res = await db.execute(select(Machine).where(Machine.id == zap.machine_id))
    machine = m_res.scalars().first()
    if machine:
        machine.status = MachineStatus.ACTIVE.value
        machine.last_zaprafka_end = zap.end_date
        # next date is end_date + zaprafka_interval_months
        
    await db.commit()
    await db.refresh(zap)
    return zap
