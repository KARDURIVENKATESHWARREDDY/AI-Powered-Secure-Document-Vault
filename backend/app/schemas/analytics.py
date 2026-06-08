from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class MonthlyMetrics(BaseModel):
    name: str  # Month or date
    cost: float
    tokens: int
    documents: int

class SecurityEventOut(BaseModel):
    id: str
    user_email: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    status: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_documents: int
    total_tokens: int
    total_cost: float
    average_latency_ms: float
    average_faithfulness: float
    average_answer_relevancy: float
    average_confidence: float
    blocked_security_events: int
    monthly_breakdown: List[MonthlyMetrics]
    recent_events: List[SecurityEventOut]
    active_documents_count: int
    archived_documents_count: int
    storage_used_bytes: int
