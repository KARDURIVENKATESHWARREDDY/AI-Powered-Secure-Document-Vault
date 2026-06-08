from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.document import ChatQuery, ChatResponse
from app.security.auth import get_current_user
from app.security.rbac import require_viewer
from app.agents.chat_workflow import run_chat_workflow

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/query", response_model=ChatResponse)
async def query_knowledge_base(
    query_in: ChatQuery,
    current_user: User = Depends(require_viewer)
):
    """
    Submits a query to the secure RAG workflow.
    Retrieves context matching user's tenant only and returns a citation-backed response
    along with simulated RAGAS evaluations and metadata.
    """
    if not query_in.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty"
        )
        
    result = await run_chat_workflow(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        query=query_in.query
    )
    return result
