from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SourceBase(BaseModel):
    title: str
    url: Optional[str] = None
    content: Optional[str] = None
    credibility_score: float = 0.8

class SourceOut(SourceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

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

class ReportBase(BaseModel):
    title: str
    topic: str

class ReportGenerate(BaseModel):
    topic: str
    title: Optional[str] = None

class ReportOut(ReportBase):
    id: str
    status: str
    content: Optional[str] = None
    pdf_url: Optional[str] = None
    docx_url: Optional[str] = None
    user_id: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    sources: List[SourceOut] = []
    evaluation: Optional[EvaluationOut] = None

    class Config:
        from_attributes = True
