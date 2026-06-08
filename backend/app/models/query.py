import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class QueryHistory(Base):
    __tablename__ = "query_histories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    query_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=False)
    retrieved_context = Column(Text, nullable=True)  # JSON serialized source chunks
    tenant_id = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    evaluation = relationship("Evaluation", uselist=False, back_populates="query", cascade="all, delete-orphan")
