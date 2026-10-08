from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid
from decimal import Decimal
from .schemas import MachineOut

class MaterialOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    unit: Optional[str] = None
    map_price: Optional[Decimal] = None
    stock_qty: Optional[Decimal] = None
    
    model_config = ConfigDict(from_attributes=True)

class RepairItemBase(BaseModel):
    item_no: int
    material_id: Optional[uuid.UUID] = None
    free_text_material: Optional[str] = None
    condition: str
    qty: Decimal
    unit: Optional[str] = None
    note: Optional[str] = None

class RepairItemCreate(RepairItemBase):
    pass

class RepairItemOutUser(RepairItemBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class RepairItemOutAdmin(RepairItemOutUser):
    unit_price: Optional[Decimal] = None
    amount: Optional[Decimal] = None

class RepairBase(BaseModel):
    machine_id: uuid.UUID
    repair_date: datetime
    type: str
    title: Optional[str] = None
    description: Optional[str] = None
    crew: Optional[str] = None
    zaprafka_id: Optional[uuid.UUID] = None
    plan_id: Optional[uuid.UUID] = None

class RepairCreate(RepairBase):
    items: List[RepairItemCreate]

class RepairOutUser(RepairBase):
    id: uuid.UUID
    status: str
    version: int
    items: List[RepairItemOutUser] = []
    model_config = ConfigDict(from_attributes=True)

class RepairOutAdmin(RepairBase):
    id: uuid.UUID
    status: str
    version: int
    items: List[RepairItemOutAdmin] = []
    model_config = ConfigDict(from_attributes=True)

class ZaprafkaBase(BaseModel):
    machine_id: uuid.UUID
    start_date: datetime
    template_id: Optional[uuid.UUID] = None
    note: Optional[str] = None

class ZaprafkaCreate(ZaprafkaBase):
    pass

class ZaprafkaOut(ZaprafkaBase):
    id: uuid.UUID
    end_date: Optional[datetime] = None
    status: str
    model_config = ConfigDict(from_attributes=True)

class TemplateItemCreate(BaseModel):
    material_id: Optional[uuid.UUID] = None
    condition: str
    qty: Decimal
    unit: Optional[str] = None
    note: Optional[str] = None

class TemplateCreate(BaseModel):
    name: str
    type: str
    items: List[TemplateItemCreate] = []

class TemplateItemOut(TemplateItemCreate):
    id: uuid.UUID
    item_no: int
    model_config = ConfigDict(from_attributes=True)

class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class PlanCreate(BaseModel):
    machine_id: uuid.UUID
    type: str
    plan_date: datetime
    description: Optional[str] = None

class PlanOut(PlanCreate):
    id: uuid.UUID
    status: str
    done_repair_id: Optional[uuid.UUID] = None
    model_config = ConfigDict(from_attributes=True)
