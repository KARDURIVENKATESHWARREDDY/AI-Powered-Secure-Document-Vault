from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class DocumentVersionOut(BaseModel):
    id: str
    document_id: str
    version: int
    storage_path: str
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    category: str
    status: str
    owner_id: str
    tenant_id: str
    version: int
    parent_id: Optional[str] = None
    storage_path: Optional[str] = None
    expiry_date: Optional[datetime] = None
    is_archived: bool
    summary: Optional[str] = None
    key_points: Optional[str] = None  # JSON string
    entities: Optional[str] = None  # JSON string
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentExpiryUpdate(BaseModel):
    expiry_days: int = Field(..., description="Number of days from now when the document expires")

class ChatQuery(BaseModel):
    query: str

class EvaluationOut(BaseModel):
    id: str
    faithfulness: float
    context_precision: float
    context_recall: float
    answer_relevancy: float
    hallucination_rate: float
    confidence_score: float
    latency_ms: int
    token_count: int
    estimated_cost: float
    created_at: datetime

    class Config:
        from_attributes = True

class CitationOut(BaseModel):
    source: str
    text_snippet: str

class ChatResponse(BaseModel):
    answer: str
    citations: List[CitationOut]
    evaluation: Dict[str, Any]
