import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, docx, txt
    category = Column(String(50), default="General")  # HR, Finance, Legal, Engineering, General
    status = Column(String(50), default="processing")  # processing, scanned, clean, quarantined, expired, archived
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(100), nullable=False)
    version = Column(Integer, default=1)
    parent_id = Column(String(36), nullable=True)  # self-reference for version linking
    storage_path = Column(String(500), nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    is_archived = Column(Boolean, default=False)
    
    # AI generated summaries and metadata
    summary = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)  # JSON or markdown list
    entities = Column(Text, nullable=True)  # Named entities list (JSON representation)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    storage_path = Column(String(500), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="versions")
    creator = relationship("User")
