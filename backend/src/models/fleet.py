from sqlalchemy import Column, String, DateTime, UUID, Integer, Float
from ..core.database import Base
import uuid
from datetime import datetime

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True)
    phone = Column(String)
    status = Column(String, default="AVAILABLE")  # AVAILABLE, ON_TRIP, OFF_DUTY
    created_at = Column(DateTime, default=datetime.utcnow)

class Truck(Base):
    __tablename__ = "trucks"
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    truck_id = Column(String, unique=True, index=True)  # e.g. TRK-001
    plate = Column(String, unique=True)
    model = Column(String)
    capacity_tons = Column(Float)
    status = Column(String, default="AVAILABLE")  # AVAILABLE, IN_USE, MAINTENANCE
    driver_id = Column(UUID, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
