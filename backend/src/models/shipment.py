from sqlalchemy import Column, String, DateTime, UUID, JSON, ForeignKey
from pgvector.sqlalchemy import Vector
from ..core.database import Base
import uuid
from datetime import datetime

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    tracking_number = Column(String, unique=True, index=True)
    origin = Column(String)
    destination = Column(String)
    status = Column(String, default="PENDING")
    driver_id = Column(UUID, nullable=True)
    vehicle_id = Column(UUID, nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    actual_delivery = Column(DateTime, nullable=True)
    shipment_metadata = Column(JSON, name="metadata", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    title = Column(String)
    content = Column(String)
    embedding = Column(Vector(384))
    shipment_id = Column(UUID, ForeignKey("shipments.id"), nullable=True)
    doc_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)