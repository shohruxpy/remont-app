from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
import uuid

class UserBase(BaseModel):
    username: str
    full_name: str
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserOut

class MachineBase(BaseModel):
    code: str
    name: str
    model: Optional[str] = None
    serial_no: Optional[str] = None
    location: Optional[str] = None
    sap_co_order: Optional[str] = None
    sap_cost_center: Optional[str] = None
    zaprafka_interval_months: int = 60
    last_zaprafka_end: Optional[datetime] = None

class MachineCreate(MachineBase):
    pass

class MachineOut(MachineBase):
    id: uuid.UUID
    status: str
    
    class Config:
        from_attributes = True

class MachineUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    model: Optional[str] = None
    serial_no: Optional[str] = None
    location: Optional[str] = None
    sap_co_order: Optional[str] = None
    sap_cost_center: Optional[str] = None
    zaprafka_interval_months: Optional[int] = None
    last_zaprafka_end: Optional[datetime] = None
    status: Optional[str] = None


