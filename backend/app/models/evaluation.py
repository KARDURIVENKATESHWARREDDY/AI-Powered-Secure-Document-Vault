import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    query_id = Column(String(36), ForeignKey("query_histories.id", ondelete="CASCADE"), nullable=False)
    
    # RAGAS / Quality Metrics
    faithfulness = Column(Float, default=1.0)
    context_precision = Column(Float, default=1.0)
    context_recall = Column(Float, default=1.0)
    answer_relevancy = Column(Float, default=1.0)
    
    # Custom AI Observability
    hallucination_rate = Column(Float, default=0.0)
    confidence_score = Column(Float, default=1.0)
    
    # Performance & Cost Tracking
    latency_ms = Column(Integer, default=0)
    token_count = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    query = relationship("QueryHistory", back_populates="evaluation")
