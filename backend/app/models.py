import uuid
import json
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, ForeignKey, 
    DateTime, Numeric, Text, Enum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .database import Base
import enum
from sqlalchemy.types import TypeDecorator, CHAR, TypeEngine

class GUID(TypeDecorator):
    impl = CHAR
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(32))
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                return "%.32x" % value.int
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

class JSONType(TypeDecorator):
    impl = String
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(String())
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name != 'postgresql':
            return json.dumps(value)
        return value
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name != 'postgresql':
            return json.loads(value)
        return value

class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"

class MachineStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    IN_ZAPRAFKA = "IN_ZAPRAFKA"
    ARCHIVED = "ARCHIVED"

class MaterialSource(str, enum.Enum):
    SAP = "SAP"
    EXCEL = "EXCEL"

class RepairType(str, enum.Enum):
    REPAIR = "REPAIR"
    INSPECTION = "INSPECTION"
    ZAPRAFKA_WORK = "ZAPRAFKA_WORK"

class RepairStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    DONE = "DONE"
    CANCELLED = "CANCELLED"

class Condition(str, enum.Enum):
    NEW = "NEW"
    REFURBISHED = "REFURBISHED"

class ZaprafkaStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    CANCELLED = "CANCELLED"

class TemplateType(str, enum.Enum):
    ZAPRAFKA = "ZAPRAFKA"
    REPAIR = "REPAIR"

class PlanType(str, enum.Enum):
    REPAIR = "REPAIR"
    ZAPRAFKA = "ZAPRAFKA"

class PlanStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    DONE = "DONE"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class BaseMixin:
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    updated_by = Column(GUID(), nullable=True)

class EditableMixin(BaseMixin):
    version = Column(Integer, default=1)
    is_archived = Column(Boolean, default=False)

class User(BaseMixin, Base):
    __tablename__ = "users"
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False) # ADMIN or USER
    is_active = Column(Boolean, default=True)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)

class Machine(EditableMixin, Base):
    __tablename__ = "machines"
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    model = Column(String)
    serial_no = Column(String)
    location = Column(String)
    commissioned_on = Column(DateTime)
    sap_co_order = Column(String, nullable=True)
    sap_cost_center = Column(String, nullable=True)
    zaprafka_interval_months = Column(Integer, default=60)
    last_zaprafka_end = Column(DateTime, nullable=True)
    status = Column(String, default=MachineStatus.ACTIVE.value)

class Material(BaseMixin, Base):
    __tablename__ = "materials"
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    unit = Column(String)
    map_price = Column(Numeric(18, 2), nullable=True)
    price_updated_at = Column(DateTime(timezone=True))
    source = Column(String, default=MaterialSource.EXCEL.value)

class Repair(EditableMixin, Base):
    __tablename__ = "repairs"
    machine_id = Column(GUID(), ForeignKey("machines.id"), nullable=False, index=True)
    repair_date = Column(DateTime, nullable=False, index=True)
    type = Column(String, nullable=False)
    title = Column(String)
    description = Column(Text)
    crew = Column(Text)
    zaprafka_id = Column(GUID(), nullable=True)
    plan_id = Column(GUID(), nullable=True)
    status = Column(String, default=RepairStatus.DONE.value)
    items = relationship("RepairItem", backref="repair")

class RepairItem(BaseMixin, Base):
    __tablename__ = "repair_items"
    repair_id = Column(GUID(), ForeignKey("repairs.id"), nullable=False, index=True)
    item_no = Column(Integer)
    material_id = Column(GUID(), nullable=True)
    free_text_material = Column(String, nullable=True)
    condition = Column(String, nullable=False)
    qty = Column(Numeric(14, 3), nullable=False)
    unit = Column(String)
    unit_price = Column(Numeric(18, 2), nullable=True)
    amount = Column(Numeric(18, 2), nullable=True)
    note = Column(Text)

class Zaprafka(EditableMixin, Base):
    __tablename__ = "zaprafka"
    machine_id = Column(GUID(), ForeignKey("machines.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    status = Column(String, default=ZaprafkaStatus.PLANNED.value)
    template_id = Column(GUID(), nullable=True)
    note = Column(Text)

class Template(EditableMixin, Base):
    __tablename__ = "templates"
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class TemplateItem(BaseMixin, Base):
    __tablename__ = "template_items"
    template_id = Column(GUID(), ForeignKey("templates.id"), nullable=False)
    item_no = Column(Integer)
    material_id = Column(GUID(), nullable=True)
    condition = Column(String)
    qty = Column(Numeric(14, 3))
    unit = Column(String)
    note = Column(Text)

class Plan(EditableMixin, Base):
    __tablename__ = "plans"
    machine_id = Column(GUID(), ForeignKey("machines.id"), nullable=False)
    type = Column(String, nullable=False)
    plan_date = Column(DateTime, nullable=False)
    description = Column(Text)
    status = Column(String, default=PlanStatus.PLANNED.value)
    done_repair_id = Column(GUID(), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"))
    action = Column(String)
    entity = Column(String)
    entity_id = Column(GUID())
    before = Column(JSONType, nullable=True)
    after = Column(JSONType, nullable=True)
    at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

class SapSyncLog(Base):
    __tablename__ = "sap_sync_log"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    mode = Column(String)
    status = Column(String)
    materials_updated = Column(Integer)
    error = Column(Text)
