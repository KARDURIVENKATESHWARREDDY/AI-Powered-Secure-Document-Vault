from typing import List, Dict, Any, TypedDict, Optional

class AgentState(TypedDict):
    # Inputs
    topic: str
    title: str
    user_id: str
    
    # Workflow steps state
    current_step: str
    plan: Dict[str, Any]
    research_findings: List[Dict[str, Any]]
    rag_context: List[Dict[str, Any]]
    draft: str
    reviews: List[Dict[str, Any]]
    verified_citations: List[Dict[str, Any]]
    
    # Metrics and tracking
    eval_scores: Dict[str, float]
    latency_ms: int
    token_count: int
    cost: float
    
    # Exporters
    pdf_url: Optional[str]
    docx_url: Optional[str]
    status: str
    error_message: Optional[str]
